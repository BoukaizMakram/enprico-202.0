const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function supabaseHeaders(extraHeaders = {}) {
  return {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
}

export async function supabaseRest(method, path, body = null, extraHeaders = {}) {
  const url = `${SUPABASE_URL}${path}`;
  const options = { method, headers: supabaseHeaders(extraHeaders) };
  if (body && method !== 'GET') {
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, ok: res.ok };
}

export async function supabaseAuth(method, path, body = null) {
  const url = `${SUPABASE_URL}${path}`;
  const options = { method, headers: supabaseHeaders() };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data, ok: res.ok };
}
