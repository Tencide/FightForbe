# Deploy the FightForge frontend on Vercel

Vercel hosts the **React (Vite) SPA** only. The **Express API** and **MySQL** must run elsewhere (e.g. [Railway](DEPLOY.md) + managed MySQL).

You can point the browser at the API in these ways:

1. **`VITE_API_BASE`** in the Vercel project (recommended). The repo’s **`frontend/vercel.json`** sets **`buildCommand`** to `FIGHTFORGE_VERCEL_BUILD=1 npm run build` so the build always runs `scripts/apply-vercel-api-rewrite.mjs`, which injects an **`/api` → your API** rewrite and forces the client to use **same-origin** `/api/...`. That avoids **“Failed to fetch”** from browser CORS. You do **not** need to enable Vercel’s optional **“System environment variables”** toggle for this to work.
2. **No dashboard env vars:** set **`API_ORIGIN_FALLBACK`** in `frontend/src/api/client.js` to your API’s `https://…` origin (one line in git), then redeploy the frontend.

---

## Prerequisites

1. Repo pushed to **GitHub** (or GitLab / Bitbucket — Vercel supports those too).
2. A **public HTTPS URL** for your API, e.g. `https://fightforge-api.up.railway.app`  
   - No trailing slash (the app normalizes this, but keep it clean).
3. Backend **`CORS_ORIGIN`** is still a good idea for your Vercel URL(s) if anything calls the API directly. With the **automatic `/api` proxy** (when `VITE_API_BASE` is set on Vercel), the browser usually only hits your `*.vercel.app` origin; many setups work even if `CORS_ORIGIN` on the API is incomplete, because the edge forwards the request server-side.

---

## Optional: manual `/api` rewrite (no `VITE_API_BASE` in the dashboard)

If you do **not** set `VITE_API_BASE` on Vercel, the build script does not inject a proxy. You can still add a **rewrite before** the SPA fallback in `frontend/vercel.json` so `/api/*` is proxied to your Railway (etc.) URL. Example (replace the destination with your real API host):

```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://YOUR-API-HOST.up.railway.app/api/:path*"
  },
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

Then leave **`VITE_API_BASE`** and **`API_ORIGIN_FALLBACK`** empty: the app calls same-origin `/api/...` and Vercel forwards to the backend. You still must set **`CORS_ORIGIN`** on the API if the upstream request includes an `Origin` your server checks.

---

## Configure the Vercel project (required)

Vercel must use the **`frontend`** folder as the project root. There is **no** `vercel.json` at the repository root — config lives in **`frontend/vercel.json`**.

1. Go to [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. **Import** your FightForge repository.
3. **Root Directory** → click **Edit** and set it to **`frontend`** (not `.` and not empty if Vercel guessed wrong).
4. Confirm **Framework Preset** is **Vite**, **Output Directory** `dist`, and that **Build Command** in the dashboard **matches `frontend/vercel.json`** (`FIGHTFORGE_VERCEL_BUILD=1 npm run build`). If the command was changed to plain `npm run build`, the automatic `/api` proxy will not run unless you restore the prefix or enable Vercel system env so `VERCEL=1` exists during build.
5. **Environment variables** (optional — skip if you use **`API_ORIGIN_FALLBACK`** in `frontend/src/api/client.js` or the **`/api` rewrite** above) — Project → Settings → Environment Variables:

   | Name | Value | Environments |
   |------|--------|----------------|
   | `VITE_API_BASE` | `https://your-api-host.example.com` | Production, Preview — omit if using fallback or proxy |
   | `VITE_SHOW_DEMO_ACCOUNTS` | `false` | Production (optional on Preview for testing) |

6. **Deploy**. After the first deploy, copy your **`.vercel.app`** URL and add it to the backend `CORS_ORIGIN`, then redeploy the API.

### Why not repository root (`.`)?

If **Root Directory** is left as **`.`**, Vercel runs install/build at the repo root where there is **no** `package.json`, and/or an old root `vercel.json` could run `cd frontend`, which **fails** when Vercel has already changed the working directory to `frontend`. Always set **Root Directory = `frontend`**.

---

## CLI (optional)

```bash
npm i -g vercel
cd path/to/FightForge/frontend
vercel
```

Link the project, set env vars in the dashboard or `vercel env add VITE_API_BASE production`.

---

## Checklist after deploy

- [ ] `https://<vercel-app>/` loads the home page.
- [ ] **Sign up** or **Log in** triggers requests to `https://<api-host>/api/...` (check Network tab).
- [ ] No CORS errors — backend `CORS_ORIGIN` matches the exact browser origin (scheme + host + port).
- [ ] Production: `VITE_SHOW_DEMO_ACCOUNTS=false` so sample credentials are not advertised.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `cd frontend: No such file or directory` | **Root Directory** must be **`frontend`**, not `.`. Remove any custom Install Command that runs `cd frontend`. |
| Blank page on `/login` or refresh | `frontend/vercel.json` rewrites should send SPA routes to `/index.html`. |
| `Failed to fetch` / signup or login on **\*.vercel.app** | Set **`VITE_API_BASE`** to your API’s `https://…` origin (no slash at end), **save**, **Redeploy**. The build injects a same-origin **`/api` proxy** so the browser no longer calls the API cross-origin (the usual CORS cause). Still ensure the API URL is correct and reachable. |
| CORS blocked | Add your Vercel URL to backend `CORS_ORIGIN` (comma-separated if multiple). |

Full stack (DB + API + env) walkthrough: **[DEPLOY.md](DEPLOY.md)**.
