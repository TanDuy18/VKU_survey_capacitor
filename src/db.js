import Dexie from 'dexie';

export const db = new Dexie('vku-field-survey');
db.version(1).stores({ surveys: 'id, status, createdAt', drafts: 'key' });
// v2: thêm bảng "cloud" giả lập CSDL máy chủ (khóa chính = UUID nên không bao giờ trùng)
db.version(2).stores({ surveys: 'id, status, createdAt', drafts: 'key', cloud: 'id, createdAt' });

export const STATUS = { PENDING: 'PENDING_SYNC', SYNCING: 'SYNCING', SYNCED: 'SYNCED' };

export const saveDraft = (data) => db.drafts.put({ key: 'current', data });
export const loadDraft = async () => (await db.drafts.get('current'))?.data;
export const clearDraft = () => db.drafts.delete('current');
