# Deploy the FightForge frontend on Vercel

Vercel hosts the **React (Vite) SPA** only. The **Express API** and **MySQL** must run elsewhere — see **[`DEPLOY.md`](DEPLOY.md)** for typical options (Render, Fly.io, a VPS, managed MySQL, etc.).

---

## Set up on Vercel (first deploy)

1. Push this repo to **GitHub** (or GitLab / Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** the repository.
3. **Root Directory** → **Edit** → set to **`frontend`** (required — do not leave `.`).
4. Leave **Framework Preset** as **Vite** (auto-detected). **Build Command** should match `frontend/vercel.json`: `FIGHTFORGE_VERCEL_BUILD=1 npm run build`. **Output Directory** → **`dist`**. **Install Command** → **`npm ci`** (from `vercel.json`).
5. **Environment Variables** → add (use **[`frontend/.env.vercel.example`](../frontend/.env.vercel.example)** as a copy-paste reference):

   | Name | Value | Environments |
   |------|--------|----------------|
   | `VITE_API_BASE` | Your API **origin** only, e.g. `https://api.example.com` — **no** `/api` suffix | **Production** and **Preview** (both — see below) |
   | `VITE_SHOW_DEMO_ACCOUNTS` | `false` for anything public | Production (optional `true` on Preview for demos) |

6. **Deploy**. When the build finishes, open the `.vercel.app` URL.
7. On your **API** host, set **`CORS_ORIGIN`** to include your Vercel origins, e.g. `https://your-project.vercel.app,https://your-project-git-main-xxx.vercel.app` (add Preview patterns if teammates use PR previews), then redeploy the API.

**Why `VITE_API_BASE` on Preview too:** the build injects a same-origin **`/api` → your API** rewrite (see `scripts/apply-vercel-api-rewrite.mjs`). If `VITE_API_BASE` is Production-only, **Preview** builds skip that rewrite; `POST /api/...` hits the static shell and often returns **405 Method Not Allowed**.

---

## How the browser reaches your API

1. **`VITE_API_BASE`** in the Vercel project (recommended). **`frontend/vercel.json`** sets **`buildCommand`** to `FIGHTFORGE_VERCEL_BUILD=1 npm run build` so the build always runs **`scripts/apply-vercel-api-rewrite.mjs`**, which injects an **`/api` → your API** rewrite and clears client `VITE_API_BASE` so the app calls **same-origin** `/api/...`. That avoids **“Failed to fetch”** from browser CORS. You do **not** need Vercel’s optional **“System environment variables”** toggle for this to work.
2. **No dashboard env vars:** set **`API_ORIGIN_FALLBACK`** in `frontend/src/api/client.js` to your API’s `https://…` origin (one line in git), then redeploy the frontend.

---

## Prerequisites

1. Repo on **GitHub** (or GitLab / Bitbucket).
2. A **public HTTPS URL** for your API, e.g. `https://api.yourdomain.com`  
   - No trailing slash (the app normalizes this, but keep it clean).
3. Backend **`CORS_ORIGIN`** including your Vercel URL(s). With the **automatic `/api` proxy** (when `VITE_API_BASE` is set on Vercel), the browser usually only hits your `*.vercel.app` origin; many setups still work if `CORS_ORIGIN` is incomplete, because the edge forwards server-side.

---

## Optional: manual `/api` rewrite (no `VITE_API_BASE` in the dashboard)

If you do **not** set `VITE_API_BASE` on Vercel, the build script does not inject a proxy. You can still add a **rewrite before** the SPA fallback in `frontend/vercel.json` so `/api/*` is proxied to your API host. Example (replace the destination with your real API origin):

```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://YOUR-API-HOST.example.com/api/:path*"
  },
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

Then leave **`VITE_API_BASE`** and **`API_ORIGIN_FALLBACK`** empty: the app calls same-origin `/api/...` and Vercel forwards to the backend. You still must set **`CORS_ORIGIN`** on the API if the upstream request includes an `Origin` your server checks.

---

## Local parity: `vercel dev`

From **`frontend/`** (after `npm install`):

```bash
npx vercel dev
```

Uses **`devCommand`** from `vercel.json` (`npm run dev`). Set **`VITE_API_BASE`** in a local **`.env`** or export it so the dev server can mirror production routing if you need to test the rewrite behavior.

---

## CLI (link repo without the dashboard)

```bash
npm i -g vercel
cd path/to/FightForge/frontend
vercel
```

Link the project, then **`vercel env add VITE_API_BASE`** for production and preview.

---

## Checklist after deploy

- [ ] `https://<vercel-app>/` loads the home page.
- [ ] **Sign up** or **Log in** triggers requests that reach your API (Network tab: `/api/...` on same host or proxied).
- [ ] No CORS errors — backend `CORS_ORIGIN` matches the exact browser origin when the browser calls the API directly.
- [ ] Production: `VITE_SHOW_DEMO_ACCOUNTS=false` so sample credentials are not advertised.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `cd frontend: No such file or directory` | **Root Directory** must be **`frontend`**, not `.`. Remove any custom Install Command that runs `cd frontend`. |
| Blank page on `/login` or refresh | `frontend/vercel.json` rewrites should send SPA routes to `/index.html`. |
| **`HTTP 405`** on **`POST /api/...`** (often on `*-git-*.vercel.app` preview URLs) | The **`/api` rewrite was not added** at build time (no **`VITE_API_BASE`** for **Preview**). Add **`VITE_API_BASE`** for **Preview** in Vercel, then **redeploy** that preview. |
| **`HTTP 502`** / generic **“Request failed”** after deploy | The `/api` proxy reached Vercel but **not** your API. Confirm **`VITE_API_BASE`** is the API **origin only** (`https://your-api-host…`), **not** `…/api`. Redeploy after env changes. Hit `/api/health` on the API host directly. |
| **`npm ci` fails** on Vercel | Lockfile out of sync with `package.json`. Run `npm install` locally in `frontend/`, commit **`package-lock.json`**, push again. |
| CORS blocked | Add your Vercel URL to backend `CORS_ORIGIN` (comma-separated if multiple). |

Full stack (DB + API + env) walkthrough: **[`DEPLOY.md`](DEPLOY.md)**.
