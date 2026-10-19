// "Máy chủ" giả lập chạy ngay trong app (IndexedDB bảng `cloud`). Không cần backend.
import { db } from './db';

const ADMIN = { email: 'admin@vku.udn.vn', password: 'admin123' };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Lưu biên bản: khóa chính UUID => gửi lại nhiều lần vẫn chỉ có 1 bản ghi
export async function cloudSave(s) {
  await wait(350); // mô phỏng độ trễ mạng để thấy trạng thái ĐANG GỬI
  try {
    await db.cloud.add({ ...s, status: 'SYNCED', receivedAt: Date.now() });
    return { duplicate: false };
  } catch (e) {
    if (e.name === 'ConstraintError') return { duplicate: true };
    throw e;
  }
}

export async function cloudLogin(email, password) {
  await wait(300);
  if (email !== ADMIN.email || password !== ADMIN.password) throw new Error('Sai email hoặc mật khẩu');
  sessionStorage.setItem('vku-admin', '1');
}
export const isAdmin = () => sessionStorage.getItem('vku-admin') === '1';
export const adminLogout = () => sessionStorage.removeItem('vku-admin');
export const cloudList = () => db.cloud.orderBy('createdAt').reverse().toArray();

// ---- Dữ liệu mẫu ----
function makeSeed() {
  let n = 7;
  const rnd = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const icon = { Hardware: '🖥️', Projector: '📽️', AC: '❄️', Electrical: '💡', Furniture: '🪑' };
  const color = { Hardware: '#0284c7', Projector: '#0b5ed7', AC: '#06b6d4', Electrical: '#f5b700', Furniture: '#e11d2e' };
  const notes = {
    Hardware: ['Máy tính khởi động chậm, màn hình nhấp nháy', 'Chuột và bàn phím không nhận', 'Ổ cứng báo lỗi, cần thay'],
    Projector: ['Máy chiếu mờ, bóng đèn sắp hết tuổi thọ', 'Không nhận cổng HDMI', 'Màn chiếu bị rách góc'],
    AC: ['Điều hòa chảy nước ra sàn', 'Máy chạy nhưng không mát', 'Remote mất, cần thay'],
    Electrical: ['Ổ cắm bàn giảng viên bị lỏng', 'Đèn hành lang chập chờn', 'Quạt trần kêu to khi chạy'],
    Furniture: ['Ghế gãy chân, cần thay 2 cái', 'Bàn bị bong mặt', 'Bảng viết khó lau sạch'],
  };
  const places = [['Khu V', [101, 102, 201, 202, 301]], ['Khu A', [101, 205, 302]], ['Khu B', [104, 203]], ['Khu C', [102, 301]], ['Thư viện', [101, 201]]];
  const rows = [];
  for (let i = 0; i < 32; i++) {
    const [building, rooms] = pick(places);
    const num = pick(rooms);
    const category = pick(Object.keys(notes));
    const rating = pick([1, 2, 2, 3, 3, 3, 4, 4, 5, 5]);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" fill="${color[category]}"/><text x="80" y="105" font-size="76" text-anchor="middle">${icon[category]}</text></svg>`;
    rows.push({
      id: crypto.randomUUID(), building, floor: Math.floor(num / 100),
      room: `${building === 'Khu V' ? 'V' : building.slice(-1)}.${num}`,
      category, rating, notes: rating <= 3 ? pick(notes[category]) : 'Hoạt động tốt',
      photo: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg),
      gps: { lat: 15.9753 + (rnd() - 0.5) * 0.002, lng: 108.2531 + (rnd() - 0.5) * 0.002, accuracy: 8 + Math.floor(rnd() * 15),
        onCampus: true, address: 'Khuôn viên VKU, 470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng' },
      createdAt: Date.now() - Math.floor(rnd() * 14 * 864e5), status: 'SYNCED', receivedAt: Date.now(),
    });
  }
  return rows;
}

export async function seedCloud(force = false) {
  if (force) await db.cloud.clear();
  if ((await db.cloud.count()) === 0) await db.cloud.bulkAdd(makeSeed());
}
