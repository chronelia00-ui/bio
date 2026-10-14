import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createShop, checkSlip } from './payments.mjs';

test('SlipOK request checks receiver, duplicate and amount; failure is never paid', async () => {
  const env = { SLIPOK_BRANCH_ID: '123', SLIPOK_API_KEY: 'test-key' };
  const result = await checkSlip({ env, image: 'image', amount: 120, request: async (url, options) => {
    assert.equal(url, 'https://api.slipok.com/api/line/apikey/123');
    assert.equal(options.headers['x-authorization'], 'test-key');
    assert.deepEqual(JSON.parse(options.body), { files: 'image', log: true, amount: 120 });
    return { ok: true, json: async () => ({ success: true, data: { success: true, transRef: 'a' } }) };
  } });
  assert.equal(result.transRef, 'a');
  for (const code of [1012, 1013, 1014, 1010, 1009]) {
    await assert.rejects(checkSlip({ env, image: 'image', amount: 120, request: async () => ({ ok: false, json: async () => ({ code }) }) }), { status: 422 });
  }
  await assert.rejects(checkSlip({ env, image: 'image', amount: 120, request: async () => { throw Error('offline'); } }), { status: 503 });
});

test('orders reject invalid slips; duplicate receipts and expired/tampered downloads stay blocked', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'chronelia-shop-'));
  await mkdir(path.join(root, 'private')); await mkdir(path.join(root, 'assets'));
  await writeFile(path.join(root, 'private', 'clip.mp4'), 'private video');
  await writeFile(path.join(root, 'assets', 'qr.png'), 'qr');
  await writeFile(path.join(root, 'catalog.json'), JSON.stringify([{ id: 'clip', active: true, name: 'Test clip', price: 120, privateFile: 'clip.mp4' }]));
  let clock = Date.parse('2026-10-14T10:00:00+07:00');
  const env = { SLIPOK_BRANCH_ID: '123', SLIPOK_API_KEY: 'test-key', SLIPOK_RECEIVER_CONFIGURED: 'true', RECEIVER_BANK: '014', PAYMENT_QR: 'assets/qr.png', DOWNLOAD_SECRET: 'a'.repeat(64) };
  const validSlip = () => ({ amount: 120, receivingBank: '014', countryCode: 'TH', receiver: {}, transRef: 'receipt-1', sendingBank: '004', transTimestamp: new Date(clock).toISOString() });
  let slip = validSlip(), calls = 0;
  const shop = createShop({ root, env, now: () => clock, verify: async () => { calls++; return slip; } });
  const server = http.createServer(async (req, res) => { if (!await shop.handle(req, res, new URL(req.url, 'http://localhost'))) { res.writeHead(404); res.end(); } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = async (route, body, token) => {
    const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  };
  const image = Buffer.from([137,80,78,71,13,10,26,10,1,2,3]).toString('base64');
  try {
    const catalog = await (await fetch(base + '/api/products')).json();
    assert.equal(catalog.checkoutEnabled, true);
    assert.equal(JSON.stringify(catalog).includes('privateFile'), false);
    const order = (await post('/api/orders', { productId: 'clip', price: 1 })).body;
    assert.equal(order.amount, 120);
    assert.equal((await post('/api/verify-slip', { orderId: order.id, image }, 'wrong')).status, 403);
    assert.equal((await post('/api/verify-slip', { orderId: order.id, image: 'dGV4dA==' }, order.token)).status, 400);
    assert.equal(calls, 0);
    for (const change of [{ amount: 1 }, { receivingBank: '004' }, { countryCode: 'US' }, { transTimestamp: new Date(clock - 60000).toISOString() }]) {
      slip = { ...validSlip(), ...change };
      assert.equal((await post('/api/verify-slip', { orderId: order.id, image }, order.token)).status, 422);
    }
    slip = validSlip();
    const paid = await post('/api/verify-slip', { orderId: order.id, image }, order.token);
    assert.equal(paid.status, 200);
    assert.equal((await post('/api/order', { orderId: order.id }, order.token)).body.paid, true);
    assert.equal((await fetch(base + paid.body.download + 'x')).status, 403);
    for (let i = 0; i < 3; i++) {
      const downloaded = await fetch(base + paid.body.download);
      assert.equal(downloaded.status, 200); assert.equal(await downloaded.text(), 'private video');
    }
    assert.equal((await fetch(base + paid.body.download)).status, 403);
    const other = (await post('/api/orders', { productId: 'clip' })).body;
    assert.equal((await post('/api/verify-slip', { orderId: other.id, image }, other.token)).status, 409);
    clock += 16 * 60 * 1000;
    assert.equal((await fetch(base + paid.body.download)).status, 403);
    assert.equal((await post('/api/order', { orderId: order.id }, order.token)).body.download, null);
    env.SLIPOK_API_KEY = '';
    assert.equal((await post('/api/orders', { productId: 'clip' })).status, 503);
  } finally {
    await new Promise(resolve => server.close(resolve)); shop.close();
    await rm(root, { recursive: true, force: true });
  }
});
