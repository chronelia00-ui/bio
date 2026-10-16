import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createShop } from './payments.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const mime = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.gif': 'image/gif', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
export function createServer(options = {}) {
  const shop = createShop({ root, ...options });
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      res.setHeader('Referrer-Policy', 'no-referrer');
      if (await shop.handle(req, res, url)) return;
      if (!['GET', 'HEAD'].includes(req.method)) {
        res.writeHead(405); return res.end();
      }
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      const asset = /^assets\/(?!.*(?:^|\/)\.)[a-zA-Z0-9_./-]+$/.test(relative) && !relative.includes('..');
      if (!['index.html', 'shop.js', 'language.js', 'cursor-particles.js', 'market-page.js', 'market-page.css', 'backgrounds.html', 'background-commissions.html', 'website-commissions.html', 'live2d.html'].includes(relative) && !asset) {
        res.writeHead(404); return res.end('Not found');
      }
      const allowedRoot = asset ? await realpath(path.join(root, 'assets')) : await realpath(root);
      const filename = await realpath(path.join(root, relative));
      if (!filename.startsWith(allowedRoot + path.sep) || !mime[path.extname(filename)]) {
        res.writeHead(404); return res.end('Not found');
      }
      const info = await stat(filename);
      if (!info.isFile()) { res.writeHead(404); return res.end(); }
      res.setHeader('Content-Type', mime[path.extname(filename)]);
      res.setHeader('Accept-Ranges', 'bytes');
      let start = 0, end = info.size - 1;
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!match || (!match[1] && !match[2])) { res.writeHead(416); return res.end(); }
        if (match[1]) {
          start = Number(match[1]);
          if (match[2]) end = Math.min(Number(match[2]), end);
        } else start = Math.max(0, info.size - Number(match[2]));
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= info.size) {
          res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); return res.end();
        }
        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
      }
      res.setHeader('Content-Length', end - start + 1);
      if (req.method === 'HEAD') return res.end();
      const stream = createReadStream(filename, { start, end });
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } catch {
      if (!res.headersSent) res.writeHead(404);
      res.end('Not found');
    }
  });
  server.on('close', () => shop.close());
  server.requestTimeout = 45000;
  return server;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createServer().listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('Preview: http://127.0.0.1:' + (process.env.PORT || 3000)));
}
