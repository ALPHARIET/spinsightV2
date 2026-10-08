import { loadEnv } from 'vite';
import { handleApi } from './handlers.js';

export function spinsightApi() {
  let env = {};
  const middleware = async (req, res, next) => {
    const m = req.url && req.url.match(/^\/api\/(topics|analyze|status|data)(?:\?.*)?$/);
    if (!m) return next();
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body = {};
    try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
    const out = await handleApi(m[1], { method: req.method, body, ip: req.socket?.remoteAddress }, { ...process.env, ...env });
    res.statusCode = out.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(out.json));
  };
  return {
    name: 'spinsight-api',
    config(_, { mode }) {
      env = loadEnv(mode, process.cwd(), '');
    },
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
