// Server demo: nhận biên bản, chống trùng bằng UUID, đăng nhập admin, xuất CSV.
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE = new URL('./data.json', import.meta.url);
const ADMIN = { email: 'admin@vku.udn.vn', password: 'admin123' };
const tokens = new Set();
const load = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : []);
const save = (rows) => fs.writeFileSync(FILE, JSON.stringify(rows));

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

// Idempotent: cùng UUID gửi nhiều lần vẫn chỉ có 1 bản ghi
app.post('/api/surveys', (req, res) => {
  const s = req.body;
  if (!s?.id || !/^[0-9a-f-]{36}$/i.test(s.id)) return res.status(400).json({ error: 'UUID không hợp lệ' });
  const rows = load();
  if (rows.some((r) => r.id === s.id)) return res.json({ ok: true, duplicate: true });
  rows.push({ ...s, status: 'SYNCED', receivedAt: Date.now() });
  save(rows);
  res.status(201).json({ ok: true, duplicate: false });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (email !== ADMIN.email || password !== ADMIN.password)
    return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
  const token = crypto.randomUUID();
  tokens.add(token);
  res.json({ token });
});

app.get('/api/surveys', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!tokens.has(token)) return res.status(401).json({ error: 'Chưa đăng nhập' });
  res.json(load().sort((a, b) => b.createdAt - a.createdAt));
});

app.listen(3001, '0.0.0.0', () => console.log('VKU server: http://localhost:3001'));
