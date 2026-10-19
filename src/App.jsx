import { useCallback, useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, STATUS } from './db';
import { syncAll, recoverStuck, requestBackgroundSync } from './sync';
import Survey from './components/Survey';
import Records from './components/Records';
import Admin from './components/Admin';

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    let handle;
    Network.getStatus().then((s) => setOnline(s.connected));
    Network.addListener('networkStatusChange', (s) => setOnline(s.connected)).then((h) => (handle = h));
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); // window.ononline
    window.addEventListener('offline', off);
    return () => {
      handle?.remove();
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

export default function App() {
  const online = useOnline();
  const [tab, setTab] = useState('survey');
  const [toast, setToast] = useState(null);
  const pending = useLiveQuery(() => db.surveys.where('status').anyOf(STATUS.PENDING, STATUS.SYNCING).count(), [], 0);

  const notify = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  const runSync = useCallback(async (manual = false) => {
    const { sent, busy } = await syncAll();
    if (sent) notify(`Đã gửi ${sent} biên bản lên máy chủ`);
    else if (manual && !busy) notify('Chưa gửi được, thử lại khi có mạng');
  }, [notify]);

  useEffect(() => { recoverStuck().then(() => navigator.onLine && runSync()); }, [runSync]);
  useEffect(() => { if (online) runSync(); }, [online, runSync]); // tự động gửi khi có mạng lại
  useEffect(() => {
    const onMsg = (e) => e.data?.type === 'SYNC' && runSync(); // từ Background Sync
    navigator.serviceWorker?.addEventListener('message', onMsg);
    return () => navigator.serviceWorker?.removeEventListener('message', onMsg);
  }, [runSync]);
  useEffect(() => { if (pending && !online) requestBackgroundSync(); }, [pending, online]);

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <div className="logo" aria-label="VKU">
            <span className="v">V</span><span className="k">K</span><span className="u">U</span>
          </div>
          <div>
            <h1>Field Survey</h1>
            <p>Kiểm tra cơ sở vật chất</p>
          </div>
        </div>
        <span className={`net ${online ? 'on' : 'off'}`} role="status">
          <i /> {online ? 'TRỰC TUYẾN (ONLINE)' : 'NGOẠI TUYẾN (OFFLINE)'}
        </span>
      </header>
      <div className="stripe"><b /><b /><b /></div>

      <main>
        {tab === 'survey' && <Survey online={online} notify={notify} onSaved={() => online && runSync()} />}
        {tab === 'records' && <Records online={online} onSync={() => runSync(true)} />}
        {tab === 'admin' && <Admin />}
      </main>

      <nav className="tabs">
        <button className={tab === 'survey' ? 'act' : ''} onClick={() => setTab('survey')}>
          <span>📝</span>Lập biên bản
        </button>
        <button className={tab === 'records' ? 'act' : ''} onClick={() => setTab('records')}>
          <span>🗂️</span>Biên bản{pending > 0 && <em>{pending}</em>}
        </button>
        <button className={tab === 'admin' ? 'act' : ''} onClick={() => setTab('admin')}>
          <span>📊</span>Quản trị
        </button>
      </nav>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
