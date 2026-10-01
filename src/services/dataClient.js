// Sesi login disimpan di peramban. Token dikirim ke server lewat header Authorization.
const SESSION_KEY = 'spinsight_session';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
}

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function fail(res, data, fallback) {
  const err = new Error(data.error || `${fallback} (${res.status}).`);
  err.status = res.status;
  return err;
}

export async function authApi(action, payload = {}) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await readJson(res);
  if (!res.ok) throw fail(res, data, 'Server tidak merespons');
  return data;
}

let refreshing = null;
async function refreshSession() {
  const current = getSession();
  if (!current?.refreshToken) return null;
  if (!refreshing) {
    refreshing = authApi('refresh', { refreshToken: current.refreshToken })
      .then(({ session }) => {
        setSession(session);
        return session;
      })
      .catch(() => {
        setSession(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// POST JSON dengan token. Jika token kedaluwarsa, diperbarui sekali lalu dicoba lagi.
export async function authedPost(path, body, fallback = 'Server tidak merespons') {
  const send = (session) =>
    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}) },
      body: JSON.stringify(body),
    });
  let session = getSession();
  if (session?.expiresAt && session.expiresAt * 1000 < Date.now() + 30000) session = await refreshSession();
  let res = await send(session);
  if (res.status === 401 && session) {
    session = await refreshSession();
    if (session) res = await send(session);
  }
  const data = await readJson(res);
  if (!res.ok) throw fail(res, data, fallback);
  return data;
}

export const dataApi = (action, payload = {}) => authedPost('/api/data', { action, ...payload }, 'Server data tidak merespons');
