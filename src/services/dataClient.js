export async function dataApi(action, payload = {}) {
  const res = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) {
    const err = new Error(data.error || `Server data tidak merespons (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}
