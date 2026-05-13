/**
 * On Vercel builds, if VITE_API_BASE is set, inject a same-origin /api proxy
 * rewrite so the browser hits https://<project>.vercel.app/api/... and Vercel
 * forwards to the real API. Avoids CORS failures that surface as "Failed to fetch".
 *
 * Runs when FIGHTFORGE_VERCEL_BUILD=1 (set in frontend/vercel.json buildCommand)
 * or when VERCEL=1 (Vercel system env, if enabled). No-op for local npm run build.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const vercelPath = path.join(root, 'vercel.json');

// Vercel only sets VERCEL=1 when "System Environment Variables" is enabled in
// the project. We always set FIGHTFORGE_VERCEL_BUILD=1 from vercel.json
// buildCommand so the /api rewrite still runs without that toggle.
const vercelPlatformBuild =
  process.env.VERCEL === '1' || process.env.FIGHTFORGE_VERCEL_BUILD === '1';

if (!vercelPlatformBuild) {
  process.exit(0);
}

const raw = (process.env.VITE_API_BASE || '').trim().replace(/\/+$/, '');
if (!raw) {
  process.exit(0);
}

if (!/^https:\/\//i.test(raw)) {
  console.warn(
    '[apply-vercel-api-rewrite] VITE_API_BASE should use https:// in production; got:',
    raw.slice(0, 48),
  );
}

let config;
try {
  config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
} catch (e) {
  console.error('[apply-vercel-api-rewrite] Could not read vercel.json:', e.message);
  process.exit(1);
}

const apiRewrite = {
  source: '/api/:path*',
  destination: `${raw}/api/:path*`,
};
const spaRewrite = { source: '/(.*)', destination: '/index.html' };

config.rewrites = [apiRewrite, spaRewrite];
fs.writeFileSync(vercelPath, `${JSON.stringify(config, null, 2)}\n`);
console.log('[apply-vercel-api-rewrite] Injected /api proxy →', raw);
