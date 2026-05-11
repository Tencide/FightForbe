# FightForge (AL_4)

MMA training and nutrition platform — **React** (Vite) frontend, **Node.js + Express** API, **MySQL** database, with role-based access for athletes, coaches, and admins.

## Team

- **Craig Omozeje** — Auth, Workouts, Progress APIs; Home, Login, Athlete Dashboard, Workouts & Progress UI, app shell.
- **Tucker Ambrose** — Users, Meals, Messaging APIs; Signup, Meals, Chat, Coach & Admin dashboards (see placeholders in the app).

Update this section with your Iowa State emails before submission.

## Prerequisites

- Node.js 20+ recommended  
- MySQL 8.x (or compatible) with a user that can create the `fightforge` database

## Database setup

From the repo root:

```bash
mysql -u root -p < backend/database/schema.sql
```

Copy `backend/.env.example` to `backend/.env` and adjust `DB_*` and `JWT_SECRET`.

Seed demo accounts (password **`Password123!`** for all three):

```bash
cd backend
npm install
npm run seed
```

Demo logins:

- `admin@fightforge.test` — admin  
- `coach@fightforge.test` — coach  
- `athlete@fightforge.test` — athlete (assigned to the demo coach)

## Run with Docker (recommended)

If you have Docker Desktop installed, the entire stack (MySQL + API + frontend) starts with one command:

```bash
docker compose up --build
```

- MySQL is initialized from `backend/database/schema.sql` on first run.
- The backend auto-seeds demo accounts on every start (idempotent).
- Frontend dev server: <http://127.0.0.1:5173>
- API health: <http://127.0.0.1:5000/api/health>

Stop everything: `docker compose down`. To wipe the database too: `docker compose down -v`.

No `.env` file is needed for Docker — credentials are wired in `docker-compose.yml`. The MySQL data persists in a named volume between runs.

## Run locally (without Docker)

**Terminal 1 — API**

```bash
cd backend
npm install
npm start
```

API defaults to `http://127.0.0.1:5000` (`GET /api/health`).

**Terminal 2 — Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open the printed Vite URL (usually `http://127.0.0.1:5173`). The dev server proxies `/api` to the backend.

## API overview (proposal)

| Area        | Base path        |
|------------|------------------|
| Auth       | `/api/auth`      |
| Users      | `/api/users`     |
| Workouts   | `/api/workouts`  |
| Meals      | `/api/meals`     |
| Progress   | `/api/progress`  |
| Messages   | `/api/messages` *(Tucker — not mounted until implemented)* |

## Known limitations

- Signup, meals, chat, coach home, and admin CRUD UIs are stubs until Tucker’s frontend and the messages route are merged.
- Production deployment (HTTPS, env hardening, hosting) is out of scope for the class demo.

## Demo walkthrough

- [`docs/DEMO.md`](docs/DEMO.md) — full run/setup reference (paths, API smoke tests, troubleshooting, branch tour).
- [`docs/TA_DEMO_GUIDE.md`](docs/TA_DEMO_GUIDE.md) — live 5–7 min presentation script for the TA demo.
