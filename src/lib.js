import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

export const BUILDINGS = ['Khu V', 'Khu A', 'Khu B', 'Khu C', 'Thư viện'];
export const FLOORS = [1, 2, 3, 4, 5, 6, 7];
export const CATEGORIES = [
  { id: 'Hardware', label: 'Phần cứng', icon: '🖥️' },
  { id: 'Projector', label: 'Máy chiếu', icon: '📽️' },
  { id: 'AC', label: 'Điều hòa', icon: '❄️' },
  { id: 'Electrical', label: 'Điện', icon: '💡' },
  { id: 'Furniture', label: 'Nội thất', icon: '🪑' },
];
export const QUICK = { building: 'Khu V', floor: 1, room: 'V.101' };

export const uuid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));

export const isNative = Capacitor.isNativePlatform();

// ---- Ảnh: nén về tối đa 1024px để IndexedDB nhẹ ----
export function fileToDataUrl(file, max = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = img.width * k;
      c.height = img.height * k;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function takeNativePhoto() {
  const p = await Camera.getPhoto({
    quality: 70, width: 1024, resultType: CameraResultType.DataUrl, source: CameraSource.Camera,
  });
  return p.dataUrl;
}

// ---- GPS + nhận diện khuôn viên VKU (hoạt động offline, không cần reverse-geocode) ----
const VKU = { lat: 15.9753, lng: 108.2531, radius: 700 };
const dist = (a, b, c, d) => {
  const R = 6371000, r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export async function getLocation() {
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
  const { latitude: lat, longitude: lng, accuracy } = pos.coords;
  const d = dist(lat, lng, VKU.lat, VKU.lng);
  return {
    lat, lng, accuracy: Math.round(accuracy),
    onCampus: d <= VKU.radius,
    address: d <= VKU.radius
      ? 'Khuôn viên VKU, 470 Trần Đại Nghĩa, Ngũ Hành Sơn, Đà Nẵng'
      : `Ngoài khuôn viên VKU (cách ~${(d / 1000).toFixed(1)} km)`,
  };
}

export const fmtTime = (t) =>
  new Date(t).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

export function toCSV(rows) {
  const head = ['id', 'thời gian', 'tòa nhà', 'tầng', 'phòng', 'hạng mục', 'đánh giá', 'ghi chú', 'vĩ độ', 'kinh độ', 'địa chỉ'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [r.id, new Date(r.createdAt).toISOString(), r.building, r.floor, r.room, r.category, r.rating, r.notes,
      r.gps?.lat, r.gps?.lng, r.gps?.address].map(esc).join(','));
  return '\uFEFF' + [head.map(esc).join(','), ...body].join('\n');
}

export function download(name, text, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
