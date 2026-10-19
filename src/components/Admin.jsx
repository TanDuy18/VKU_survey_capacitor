import { useEffect, useState } from 'react';
import { CATEGORIES, toCSV, download, fmtTime } from '../lib';
import { cloudLogin, cloudList, isAdmin, adminLogout, seedCloud } from '../cloud';

export default function Admin() {
  const [authed, setAuthed] = useState(isAdmin());
  const [email, setEmail] = useState('admin@vku.udn.vn');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [rows, setRows] = useState(null);

  const login = async (e) => {
    e.preventDefault(); setErr('');
    try { await cloudLogin(email, pw); setAuthed(true); } catch (ex) { setErr(ex.message); }
  };
  const logout = () => { adminLogout(); setAuthed(false); setRows(null); };
  const load = () => cloudList().then(setRows);
  useEffect(() => { if (authed) load(); }, [authed]);

  if (!authed)
    return (
      <form className="card" onSubmit={login}>
        <h2>Đăng nhập quản trị viên</h2>
        <label htmlFor="em">Email</label>
        <input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="pw">Mật khẩu</label>
        <input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="err">{err}</p>}
        <div className="actions"><button className="primary">Đăng nhập</button></div>
        <p className="hint">
          Dùng thử: mật khẩu là{' '}
          <button type="button" onClick={() => { setEmail('admin@vku.udn.vn'); setPw('admin123'); }}>admin123</button>
          {' '}(bấm để tự điền)
        </p>
      </form>
    );

  if (!rows) return <p className="empty">Đang tải…</p>;

  const avg = rows.length ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1) : '–';
  const count = (key) => Object.entries(rows.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const byB = count('building'), byC = count('category');
  const max = (arr) => Math.max(1, ...arr.map((x) => x[1]));

  return (
    <section>
      <div className="bar">
        <h2>Thống kê toàn trường</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="ghost sm" onClick={load}>Làm mới</button>
          <button className="ghost sm" onClick={logout}>Đăng xuất</button>
        </div>
      </div>
      <div className="kpis">
        <div><b>{rows.length}</b><span>Biên bản</span></div>
        <div><b>{avg}★</b><span>Điểm TB</span></div>
        <div><b>{rows.filter((r) => r.rating <= 2).length}</b><span>Cần sửa gấp</span></div>
      </div>
      <div className="card">
        <h3>Theo tòa nhà</h3>
        {byB.map(([k, v]) => <div className="bars" key={k}><span>{k}</span><i style={{ width: `${(v / max(byB)) * 100}%` }} /><b>{v}</b></div>)}
        <h3>Theo hạng mục</h3>
        {byC.map(([k, v]) => <div className="bars c" key={k}><span>{CATEGORIES.find((c) => c.id === k)?.label || k}</span><i style={{ width: `${(v / max(byC)) * 100}%` }} /><b>{v}</b></div>)}
      </div>
      <button className="primary full" disabled={!rows.length} onClick={() => download(`vku-khao-sat-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows))}>
        Xuất CSV
      </button>
      {rows.slice(0, 20).map((r) => (
        <article className="rec" key={r.id}>
          {r.photo ? <img src={r.photo} alt="" /> : <div className="noimg">🛠️</div>}
          <div><b>{r.building} · T{r.floor} · {r.room}</b><span>{r.category} · {r.rating}★</span><small>{fmtTime(r.createdAt)}</small></div>
        </article>
      ))}
      <p className="hint"><button type="button" onClick={() => seedCloud(true).then(load)}>Nạp lại dữ liệu mẫu</button></p>
    </section>
  );
}
