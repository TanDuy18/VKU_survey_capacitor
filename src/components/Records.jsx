import { useLiveQuery } from 'dexie-react-hooks';
import { db, STATUS } from '../db';
import { CATEGORIES, fmtTime } from '../lib';

const LABEL = { PENDING_SYNC: 'CHỜ GỬI', SYNCING: 'ĐANG GỬI', SYNCED: 'ĐÃ GỬI MÁY CHỦ' };
const CLS = { PENDING_SYNC: 'pend', SYNCING: 'sending', SYNCED: 'done' };

export default function Records({ onSync }) {
  const rows = useLiveQuery(() => db.surveys.orderBy('createdAt').reverse().toArray(), [], []);
  const pending = rows.filter((r) => r.status !== STATUS.SYNCED).length;
  return (
    <section>
      <div className="bar">
        <h2>{rows.length} biên bản · {pending} chờ gửi</h2>
        <button className="primary sm" disabled={!pending} onClick={onSync}>Gửi tất cả</button>
      </div>
      {rows.length === 0 && <p className="empty">Chưa có biên bản nào. Qua tab “Lập biên bản” để bắt đầu kiểm tra.</p>}
      {rows.map((r) => (
        <article className="rec" key={r.id}>
          {r.photo ? <img src={r.photo} alt="" /> : <div className="noimg">🛠️</div>}
          <div>
            <b>{r.building} · Tầng {r.floor} · {r.room}</b>
            <span>{CATEGORIES.find((c) => c.id === r.category)?.label} · {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            {r.notes && <p>{r.notes}</p>}
            <small>{fmtTime(r.createdAt)} · {r.id.slice(0, 8)}</small>
          </div>
          <i className={`badge ${CLS[r.status]}`}>{LABEL[r.status]}</i>
        </article>
      ))}
    </section>
  );
}
