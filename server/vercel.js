import { handleApi } from './handlers.js';

export const vercelHandler = (route) => async (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket?.remoteAddress;
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const out = await handleApi(route, { method: req.method, body: body || {}, ip, token });
  res.status(out.status).json(out.json);
};
