import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { mkdirSync, createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';

const hash = value => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
export const cents = value => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || Math.abs(number * 100 - Math.round(number * 100)) > .00001) return null;
  return Math.round(number * 100);
};
async function jsonBody(req, max = 8 * 1024 * 1024) {
  if (!String(req.headers['content-type']).startsWith('application/json')) fail(415, 'รูปแบบข้อมูลไม่ถูกต้อง');
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) fail(413, 'รูปสลิปต้องมีขนาดไม่เกิน 5 MB');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { fail(400, 'ข้อมูลไม่ถูกต้อง'); }
}
export function imageType(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
export async function checkSlip({ image, amount, env, request = fetch }) {
  let response;
  try {
    response = await request(`https://api.slipok.com/api/line/apikey/${encodeURIComponent(env.SLIPOK_BRANCH_ID)}`, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json', 'x-authorization': env.SLIPOK_API_KEY },
      body: JSON.stringify({ files: image, log: true, amount })
    });
  } catch { fail(503, 'ตรวจสลิปไม่สำเร็จ หากโอนแล้วอย่าโอนซ้ำ กรุณาติดต่อร้าน'); }
  let result;
  try { result = await response.json(); } catch { fail(503, 'บริการตรวจสลิปไม่พร้อม กรุณาติดต่อร้าน'); }
  if (!response.ok || result.success !== true || result.data?.success !== true) {
    const messages = { 1012: 'สลิปนี้ถูกใช้แล้ว หากเป็นออเดอร์ของคุณกรุณาติดต่อร้าน', 1013: 'ยอดเงินไม่ตรงกับออเดอร์', 1014: 'บัญชีผู้รับเงินไม่ตรงกับร้าน', 1010: 'ธนาคารยังไม่พร้อมยืนยันสลิป กรุณารอสักครู่แล้วลองใหม่', 1009: 'ธนาคารขัดข้อง กรุณาตรวจใหม่ภายหลัง' };
    fail(422, messages[result.code] || 'ตรวจสลิปไม่ผ่าน กรุณาตรวจรูปและติดต่อร้านหากโอนแล้ว');
  }
  return result.data;
}
export function createShop({ root, env = process.env, now = Date.now, verify = checkSlip, dbPath } = {}) {
  mkdirSync(path.join(root, 'data'), { recursive: true });
  const db = new DatabaseSync(dbPath || path.join(root, 'data', 'shop.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, token TEXT NOT NULL, product TEXT NOT NULL, filename TEXT NOT NULL, amount INTEGER NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL, paid INTEGER, downloads INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS receipts (reference TEXT PRIMARY KEY, order_id TEXT UNIQUE NOT NULL);`);
  const working = new Set();
  const limits = new Map();
  const configured = () => Boolean(env.SLIPOK_API_KEY && /^\d+$/.test(env.SLIPOK_BRANCH_ID || '') && env.SLIPOK_RECEIVER_CONFIGURED === 'true' && /^\d{3}$/.test(env.RECEIVER_BANK || '') && (env.DOWNLOAD_SECRET || '').length >= 32 && /^assets\/[\w/-]+\.(png|jpg|webp)$/.test(env.PAYMENT_QR || ''));
  async function privatePath(filename) {
    if (typeof filename !== 'string' || !/^[\w-]+\.mp4$/.test(filename)) fail(503, 'ไฟล์สินค้ายังไม่พร้อม');
    const directory = await realpath(path.join(root, 'private'));
    const target = await realpath(path.join(directory, filename));
    if (!target.startsWith(directory + path.sep) || !(await stat(target)).isFile()) fail(503, 'ไฟล์สินค้ายังไม่พร้อม');
    return target;
  }
  const send = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  const signature = payload => createHmac('sha256', env.DOWNLOAD_SECRET).update(payload).digest('base64url');
  function downloadUrl(order) {
    const payload = Buffer.from(JSON.stringify({ id: order.id, exp: order.paid + 15 * 60 * 1000 })).toString('base64url');
    return '/download?token=' + payload + '.' + signature(payload);
  }
  return {
    close: () => db.close(),
    async handle(req, res, url) {
      if (!url.pathname.startsWith('/api/') && url.pathname !== '/download') return false;
      try {
        if (req.method === 'POST' && (req.headers['sec-fetch-site'] === 'cross-site' || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`))) fail(403, 'คำขอจากเว็บไซต์อื่นไม่อนุญาต');
        if (url.pathname === '/api/products' && req.method === 'GET') {
          const products = JSON.parse(await readFile(path.join(root, 'catalog.json'), 'utf8'));
          send(res, 200, { products: products.filter(p => p.active && cents(p.price)).map(p => ({ id: p.id, name: p.name, price: p.price, description: p.description, preview: p.preview, category: p.category || 'backgrounds' })), checkoutEnabled: configured() });
          return true;
        }
        if (!configured()) fail(503, 'ร้านยังไม่เปิดรับชำระเงิน');
        if (url.pathname === '/download' && req.method === 'GET') {
          const [payload, sig, extra] = (url.searchParams.get('token') || '').split('.');
          if (!payload || extra || !equal(signature(payload), sig)) fail(403, 'ลิงก์ดาวน์โหลดไม่ถูกต้อง');
          let claim;
          try { claim = JSON.parse(Buffer.from(payload, 'base64url')); } catch { fail(403, 'ลิงก์ไม่ถูกต้อง'); }
          const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(String(claim.id));
          if (!order?.paid || !Number.isFinite(claim.exp) || claim.exp !== order.paid + 900000 || now() >= claim.exp) fail(403, 'ลิงก์ดาวน์โหลดหมดอายุ กรุณาติดต่อร้าน');
          const filename = await privatePath(order.filename);
          const result = db.prepare('UPDATE orders SET downloads = downloads + 1 WHERE id = ? AND downloads < 3').run(order.id);
          if (!result.changes) fail(403, 'ครบจำนวนดาวน์โหลดแล้ว กรุณาติดต่อร้าน');
          res.writeHead(200, { 'Content-Type': 'video/mp4', 'Content-Disposition': `attachment; filename="${order.filename}"`, 'Content-Length': (await stat(filename)).size, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' });
          const stream = createReadStream(filename);
          stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res);
          return true;
        }
        if (req.method !== 'POST' || !['/api/orders', '/api/verify-slip', '/api/order'].includes(url.pathname)) fail(404, 'ไม่พบข้อมูล');
        // Bound anonymous order creation and paid API calls, without trusting forwarded IP headers.
        const key = req.socket.remoteAddress;
        if (limits.size > 10000) for (const [ip, state] of limits) if (now() - state.time > 60000) limits.delete(ip);
        const limit = limits.get(key);
        if (limit && now() - limit.time < 60000) { if (++limit.count > 12) fail(429, 'กรุณารอสักครู่แล้วลองใหม่'); }
        else limits.set(key, { time: now(), count: 1 });
        if (url.pathname === '/api/orders') {
          const body = await jsonBody(req, 4096);
          const products = JSON.parse(await readFile(path.join(root, 'catalog.json'), 'utf8'));
          const product = products.find(p => p.id === body.productId && p.active);
          if (!product || !cents(product.price) || (product.category && product.category !== 'backgrounds')) fail(404, 'ไม่พบสินค้าที่เปิดจำหน่าย');
          await privatePath(product.privateFile);
          await stat(path.join(root, env.PAYMENT_QR));
          const id = randomBytes(16).toString('hex'), token = randomBytes(32).toString('hex');
          const created = now(), expires = created + 30 * 60 * 1000;
          db.prepare('INSERT INTO orders (id, token, product, filename, amount, created, expires) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, hash(token), product.id, product.privateFile, cents(product.price), created, expires);
          send(res, 201, { id, token, name: product.name, amount: cents(product.price) / 100, expires, qr: env.PAYMENT_QR });
          return true;
        }
        const body = await jsonBody(req);
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(String(body.orderId));
        if (!order || !equal(order.token, hash(String(req.headers.authorization || '').replace(/^Bearer /, '')))) fail(403, 'ไม่มีสิทธิ์เข้าถึงออเดอร์');
        if (order.paid) { send(res, 200, { paid: true, download: now() < order.paid + 900000 ? downloadUrl(order) : null }); return true; }
        if (url.pathname === '/api/order') { send(res, 200, { paid: false }); return true; }
        if (now() >= order.expires) fail(410, 'ออเดอร์หมดอายุ หากโอนแล้วกรุณาติดต่อร้าน');
        if (working.has(order.id)) fail(409, 'กำลังตรวจสลิปนี้อยู่');
        if (typeof body.image !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.image)) fail(400, 'รูปสลิปไม่ถูกต้อง');
        const image = Buffer.from(body.image, 'base64');
        if (image.length > 5 * 1024 * 1024 || !imageType(image)) fail(400, 'รองรับรูป JPG, PNG, WEBP ไม่เกิน 5 MB');
        working.add(order.id);
        try {
          const slip = await verify({ image: body.image, amount: order.amount / 100, env });
          const timestamp = Date.parse(slip.transTimestamp || `${String(slip.transDate).slice(0,4)}-${String(slip.transDate).slice(4,6)}-${String(slip.transDate).slice(6,8)}T${slip.transTime}+07:00`);
          if (cents(slip.amount) !== order.amount || slip.receivingBank !== env.RECEIVER_BANK || slip.countryCode !== 'TH' || (slip.paidLocalCurrency && slip.paidLocalCurrency !== '764') || !slip.receiver || !slip.transRef || !slip.sendingBank) fail(422, 'ยอดเงินหรือผู้รับไม่ตรงกับร้าน กรุณาติดต่อร้าน');
          if (!Number.isFinite(timestamp) || timestamp < order.created - 5000 || timestamp > Math.min(now() + 60000, order.expires)) fail(422, 'เวลาจ่ายไม่ตรงกับออเดอร์ กรุณาติดต่อร้าน');
          const paid = now();
          db.exec('BEGIN IMMEDIATE');
          try {
            db.prepare('INSERT INTO receipts (reference, order_id) VALUES (?, ?)').run(`${slip.sendingBank}:${slip.transRef}`, order.id);
            db.prepare('UPDATE orders SET paid = ? WHERE id = ? AND paid IS NULL').run(paid, order.id);
            db.exec('COMMIT');
          } catch { db.exec('ROLLBACK'); fail(409, 'สลิปนี้ใช้กับออเดอร์อื่นแล้ว กรุณาติดต่อร้าน'); }
          send(res, 200, { paid: true, download: downloadUrl({ ...order, paid }) });
        } finally { working.delete(order.id); }
        return true;
      } catch (error) {
        send(res, error.status || 503, { error: error.status ? error.message : 'ระบบยังไม่พร้อม กรุณาติดต่อร้าน หากโอนแล้วอย่าโอนซ้ำ' });
        return true;
      }
    }
  };
}
