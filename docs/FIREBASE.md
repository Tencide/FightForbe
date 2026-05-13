# Optional Firebase Authentication

FightForge can use **Firebase Authentication** (email/password) for sign-up and sign-in. The **Express API and MySQL database stay the same**: after Firebase validates the user, the browser sends the Firebase **ID token** to `POST /api/auth/firebase-session`, the server verifies it with **Firebase Admin**, then issues the usual **FightForge JWT** and loads/creates the **MySQL `users`** row (including a `firebase_uid` column).

If you **do not** set the Firebase env vars below, behavior is unchanged: email/password goes directly to `/api/auth/login` and `/api/auth/signup`.

---

## 1. Firebase console

1. [Firebase Console](https://console.firebase.google.com/) → **Add project** (or open an existing project).
2. **Build** → **Authentication** → **Get started** → enable **Email/Password**.
3. **Project settings** (gear) → **Your apps** → **Web** (`</>`) → register an app. Copy:
   - **apiKey**
   - **authDomain**
   - **projectId**
   - **appId** (optional but recommended for the web SDK)

4. **Project settings** → **Service accounts** → **Generate new private key** → download JSON.  
   You will paste this JSON **as a single line** into your API host’s environment (see below). **Never commit** that file to git.

---

## 2. MySQL migration

Existing databases need the `firebase_uid` column (and unique index). Run **once** in your MySQL client or host’s SQL console:

`backend/database/migration_firebase_auth.sql`

New installs that use **`schema.sql`** or **`schema.single_mysql_database.sql`** from this repo already include `firebase_uid` and the index.

---

## 3. Backend (production or local)

Add a variable **`FIREBASE_SERVICE_ACCOUNT_JSON`** whose value is the **entire** service account JSON **minified to one line** (no line breaks). Example shape:

```json
{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",...}
```

Keep `\n` inside `private_key` as in the downloaded file when you stringify, or paste the minified JSON exactly as from the file contents.

Redeploy the API after saving variables.

---

## 4. Frontend (Vercel / local)

Set these **Vite** variables (Production **and** Preview if you use previews):

| Name | Source |
|------|--------|
| `VITE_FIREBASE_API_KEY` | Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID |
| `VITE_FIREBASE_APP_ID` | Web app ID |

You still need **`VITE_API_BASE`** (or the Vercel `/api` proxy) so the SPA can reach **`/api/auth/firebase-session`**.

Redeploy the frontend after changing env vars.

---

## 5. Behavior summary

| Mode | Sign up / Log in |
|------|-------------------|
| Firebase vars **not** set | Same as before: `POST /api/auth/signup` and `/api/auth/login`. |
| Firebase vars **set** | Firebase client auth → `POST /api/auth/firebase-session` with `idToken`. |
| Log in: Firebase **user-not-found** | Falls back to legacy **`/api/auth/login`** (MySQL-only accounts). |
| Log out | Signs out Firebase (if used) and clears FightForge JWT / local user. |

---

## 6. CORS

`CORS_ORIGIN` on the API must still include your **Vercel** (or other) frontend origin. Firebase does not remove that requirement for calls to your own API.
