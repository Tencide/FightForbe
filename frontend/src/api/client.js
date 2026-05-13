const TOKEN_KEY = 'fightforge_token';

/**
 * Optional hardcoded production API origin when you do **not** use `VITE_API_BASE`
 * (e.g. no variables in the Vercel dashboard). Must be `https://` if the site is HTTPS.
 * Leave empty to use `VITE_API_BASE` only, or same-origin `/api` (dev proxy / optional Vercel rewrite).
 *
 * Example: 'https://fightforge-api-production.up.railway.app'
 */
const API_ORIGIN_FALLBACK = '';

/**
 * Resolved API base: env wins, then in-file fallback. Trailing slashes stripped.
 * - Dev: usually empty → `/api/...` proxied by Vite to the backend.
 * - Prod: set `VITE_API_BASE` in the host **or** set `API_ORIGIN_FALLBACK` above.
 */
const API_BASE = (import.meta.env.VITE_API_BASE || API_ORIGIN_FALLBACK || '').replace(/\/+$/, '');

export function buildUrl(path) {
  if (!API_BASE) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * True when this is a production build (e.g. Vercel). Dev server has import.meta.env.DEV.
 */
function isProdBuild() {
  return import.meta.env.PROD === true;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function parseJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const vercelSameOriginProxy = import.meta.env.VITE_FF_VERCEL_PROXY === '1';
  if (isProdBuild() && path.startsWith('/api') && !API_BASE && !vercelSameOriginProxy) {
    throw new Error(
      'API URL is not configured. Either set VITE_API_BASE in your host (e.g. Vercel) and redeploy, or set API_ORIGIN_FALLBACK in frontend/src/api/client.js to your Express API origin (https, no trailing slash).'
    );
  }
  if (
    isProdBuild() &&
    API_BASE &&
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    API_BASE.startsWith('http:')
  ) {
    throw new Error(
      'API base must use https:// when the site is served over HTTPS (mixed content blocks http:// APIs).'
    );
  }

  const headers = { Accept: 'application/json' };
  const auth = token ?? getToken();
  if (auth) headers.Authorization = `Bearer ${auth}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const url = buildUrl(path);
  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const raw =
      e != null && typeof e.message === 'string'
        ? e.message
        : e != null && typeof e === 'object' && 'message' in e
          ? String(e.message)
          : String(e ?? '');
    const lower = raw.toLowerCase();
    const isNetworkish =
      e instanceof TypeError ||
      (typeof DOMException !== 'undefined' && e instanceof DOMException) ||
      lower.includes('failed to fetch') ||
      lower.includes('networkerror') ||
      lower.includes('network error') ||
      lower.includes('network request failed') ||
      lower.includes('load failed') ||
      lower.includes('econnrefused');
    if (isNetworkish) {
      let hint = '';
      if (typeof window !== 'undefined') {
        const onVercel =
          window.location.hostname === 'vercel.app' ||
          window.location.hostname.endsWith('.vercel.app');
        if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
          hint =
            " Often: API is down, wrong API URL, or CORS — add this site's origin to the backend CORS_ORIGIN.";
          if (onVercel) {
            hint += ` Vercel: (1) Project → Settings → Environment Variables → add VITE_API_BASE = your API base URL (e.g. https://xxx.up.railway.app), no trailing slash. (2) Save, then Redeploy (env is applied at build time). (3) On the API server, set CORS_ORIGIN to include https://${window.location.host} (add preview URLs too if you use Preview deployments).`;
          }
        } else if (url.startsWith('/')) {
          hint =
            ' For local dev: start the API (cd backend && npm start) on port 5000, or set VITE_PROXY_TARGET in frontend/.env to match your API port.';
          if (onVercel) {
            hint +=
              ' On Vercel, a relative /api URL only works if you add an /api proxy rewrite in frontend/vercel.json (see docs/VERCEL.md) or set VITE_API_BASE to your API.';
          }
        }
      }
      throw new Error(`Could not reach the server (${raw}).${hint}`);
    }
    throw e;
  }

  const data = await parseJson(res);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (path.startsWith('/api') && ct.includes('text/html') && res.ok) {
    throw new Error(
      'Received HTML instead of JSON — /api hit the static host, not your API. Set VITE_API_BASE or API_ORIGIN_FALLBACK in frontend/src/api/client.js, or add a Vercel rewrite from /api to your backend (see docs/VERCEL.md).'
    );
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || res.statusText || 'Request failed';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
