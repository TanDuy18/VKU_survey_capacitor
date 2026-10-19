import { useEffect, useRef, useState } from 'react';
import { db, STATUS, saveDraft, loadDraft, clearDraft } from '../db';
import { BUILDINGS, FLOORS, CATEGORIES, QUICK, uuid, isNative, fileToDataUrl, takeNativePhoto, getLocation } from '../lib';

const EMPTY = { building: '', floor: '', room: '', category: '', rating: 0, notes: '', photo: '' };
const STEPS = ['Vị trí', 'Hiện trạng', 'Ảnh & GPS'];

export default function Survey({ notify, onSaved }) {
  const [f, setF] = useState(EMPTY);
  const [step, setStep] = useState(0);
  const [gps, setGps] = useState(null);
  const [gpsErr, setGpsErr] = useState('');
  const [ready, setReady] = useState(false);
  const fileRef = useRef();

  // Khôi phục bản nháp sau khi refresh
  useEffect(() => {
    loadDraft().then((d) => {
      if (d) { setF(d.f); setStep(d.step ?? 0); if (d.f.building) notify('Đã khôi phục bản nháp'); }
      setReady(true);
    });
  }, []);
  // Ghi nháp vào IndexedDB mỗi lần thay đổi
  useEffect(() => { if (ready) saveDraft({ f, step }); }, [f, step, ready]);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const locate = async () => {
    setGpsErr('');
    try { setGps(await getLocation()); } catch { setGps(null); setGpsErr('Không lấy được GPS. Hãy bật định vị và cấp quyền.'); }
  };
  useEffect(() => { if (step === 2 && !gps) locate(); }, [step]);

  const pickPhoto = async () => {
    if (isNative) { try { set('photo', await takeNativePhoto()); } catch {} }
    else fileRef.current.click();
  };
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) set('photo', await fileToDataUrl(file));
  };

  const valid = [f.building && f.floor && f.room.trim(), f.category && f.rating, true];
  const save = async () => {
    const t0 = performance.now();
    await db.surveys.add({
      id: uuid(), ...f, room: f.room.trim(), floor: Number(f.floor), gps,
      createdAt: Date.now(), status: STATUS.PENDING,
    });
    await clearDraft();
    const ms = Math.round(performance.now() - t0);
    navigator.vibrate?.(80);
    notify(`Đã lưu biên bản trên máy (${ms} ms)`);
    setF(EMPTY); setStep(0); setGps(null);
    onSaved();
  };

  return (
    <section className="card">
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'cur' : i < step ? 'done' : ''}>
            <b>{i < step ? '✓' : i + 1}</b>{s}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <>
          <button className="quick" onClick={() => setF((p) => ({ ...p, ...QUICK }))}>
            ⚡ Chọn nhanh: Khu V · Tầng 1 · Phòng V.101
          </button>
          <label>Tòa nhà</label>
          <div className="chips">
            {BUILDINGS.map((b) => (
              <button key={b} className={f.building === b ? 'sel' : ''} onClick={() => set('building', b)}>{b}</button>
            ))}
          </div>
          <div className="row">
            <div>
              <label htmlFor="fl">Tầng</label>
              <select id="fl" value={f.floor} onChange={(e) => set('floor', e.target.value)}>
                <option value="">Chọn tầng</option>
                {FLOORS.map((n) => <option key={n} value={n}>Tầng {n}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="rm">Số phòng</label>
              <input id="rm" value={f.room} placeholder="V.101" onChange={(e) => set('room', e.target.value)} />
            </div>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <label>Hạng mục kiểm tra</label>
          <div className="cats">
            {CATEGORIES.map((c) => (
              <button key={c.id} className={f.category === c.id ? 'sel' : ''} onClick={() => set('category', c.id)}>
                <span>{c.icon}</span>{c.label}
              </button>
            ))}
          </div>
          <label>Tình trạng (1 = hỏng nặng, 5 = tốt)</label>
          <div className="stars" role="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={f.rating === n} aria-label={`${n} sao`}
                className={n <= f.rating ? 'on' : ''} onClick={() => set('rating', n)}>★</button>
            ))}
          </div>
          <label htmlFor="nt">Ghi chú lỗi</label>
          <textarea id="nt" rows={4} value={f.notes} placeholder="Ví dụ: máy chiếu mờ, không nhận cổng HDMI"
            onChange={(e) => set('notes', e.target.value)} />
        </>
      )}

      {step === 2 && (
        <>
          <label>Ảnh thiết bị hư hỏng</label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
          {f.photo ? (
            <div className="photo">
              <img src={f.photo} alt="Ảnh hiện trạng" />
              <button onClick={pickPhoto}>Chụp lại</button>
            </div>
          ) : (
            <button className="cam" onClick={pickPhoto}>📷 Chụp / chọn ảnh</button>
          )}
          <label>Vị trí GPS</label>
          <div className={`gps ${gps?.onCampus ? 'ok' : ''}`}>
            {gps ? (
              <>
                <strong>{gps.onCampus ? '📍 Trong khuôn viên VKU' : '📍 Ngoài khuôn viên'}</strong>
                <span>{gps.address}</span>
                <small>{gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} · ±{gps.accuracy} m</small>
              </>
            ) : <span>{gpsErr || 'Đang xác định vị trí…'}</span>}
            <button onClick={locate}>Lấy lại</button>
          </div>
          <div className="sum">
            {f.building} · Tầng {f.floor} · {f.room} · {CATEGORIES.find((c) => c.id === f.category)?.label} · {f.rating}★
          </div>
        </>
      )}

      <div className="actions">
        {step > 0 && <button className="ghost" onClick={() => setStep(step - 1)}>Quay lại</button>}
        {step < 2
          ? <button className="primary" disabled={!valid[step]} onClick={() => setStep(step + 1)}>Tiếp tục</button>
          : <button className="primary" onClick={save}>Lưu biên bản</button>}
      </div>
    </section>
  );
}
