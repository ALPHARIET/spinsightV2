// Server produksi (Render, atau hosting Node lain): menyajikan hasil build di dist/ dan /api/*.
// Jalankan: npm run build && npm start
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from './handlers.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY = 2 * 1024 * 1024;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > MAX_BODY) throw new Error('too large');
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

async function api(req, res, route) {
  let body = {};
  try {
    body = await readBody(req);
  } catch {
    return send(res, 413, JSON.stringify({ error: 'Permintaan terlalu besar.' }), { 'Content-Type': TYPES['.json'] });
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress;
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const out = await handleApi(route, { method: req.method, body, ip, token });
  send(res, out.status, JSON.stringify(out.json), { 'Content-Type': TYPES['.json'], 'Cache-Control': 'no-store' });
}

async function staticFile(req, res, pathname) {
  let rel;
  try {
    rel = decodeURIComponent(pathname);
  } catch {
    return send(res, 400, 'Bad request');
  }
  const file = path.resolve(ROOT, '.' + rel);
  if (file.startsWith(ROOT + path.sep) && path.extname(file)) {
    try {
      const data = await readFile(file);
      const immutable = rel.startsWith('/assets/');
      return send(res, 200, req.method === 'HEAD' ? undefined : data, {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
      });
    } catch {}
  }
  // Rute SPA (/spin, /arena, ...) diarahkan ke index.html.
  const html = await readFile(path.join(ROOT, 'index.html'));
  send(res, 200, req.method === 'HEAD' ? undefined : html, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-cache' });
}

const server = http.createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const m = pathname.match(/^\/api\/(topics|analyze|status|data|auth)\/?$/);
    if (m) return await api(req, res, m[1]);
    if (pathname.startsWith('/api/')) return send(res, 404, JSON.stringify({ error: 'Endpoint tidak ditemukan.' }), { 'Content-Type': TYPES['.json'] });
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    await staticFile(req, res, pathname);
  } catch (e) {
    console.error('[server]', e);
    if (!res.headersSent) send(res, 500, 'Internal error');
  }
});

server.requestTimeout = 300000;
server.listen(PORT, '0.0.0.0', () => console.log(`SpinSight berjalan di port ${PORT}`));
