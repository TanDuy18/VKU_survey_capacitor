import { Network } from '@capacitor/network';
import { db, STATUS } from './db';
import { cloudSave } from './cloud';

let running = false;

// Gửi lần lượt từng biên bản; mất mạng thì dừng và giữ nguyên hàng đợi
export async function syncAll() {
  if (running) return { sent: 0, busy: true }; // chặn bấm "Gửi tất cả" nhiều lần
  running = true;
  let sent = 0;
  try {
    if (!(await Network.getStatus()).connected) return { sent: 0, offline: true };
    const pending = await db.surveys.where('status').equals(STATUS.PENDING).sortBy('createdAt');
    for (const s of pending) {
      if (!(await Network.getStatus()).connected) break;
      await db.surveys.update(s.id, { status: STATUS.SYNCING });
      try {
        const { status, ...data } = s;
        await cloudSave(data);
        await db.surveys.update(s.id, { status: STATUS.SYNCED, syncedAt: Date.now() });
        sent++;
      } catch {
        await db.surveys.update(s.id, { status: STATUS.PENDING });
        break;
      }
    }
  } finally {
    running = false;
  }
  return { sent };
}

export const recoverStuck = () =>
  db.surveys.where('status').equals(STATUS.SYNCING).modify({ status: STATUS.PENDING });

export async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    await reg?.sync?.register('vku-sync');
  } catch {}
}
