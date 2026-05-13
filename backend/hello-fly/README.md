# hello-fly

Sample Fly.io Express app (from [fly-apps/hello-fly](https://github.com/fly-apps/hello-fly)).

## Run on Fly

From **this folder** (`backend/hello-fly`):

```powershell
flyctl launch
```

Use **`fly.toml`** in this directory — it sets **`primary_region = "iad"`** so you avoid the **`region  not found`** error when the launcher would otherwise leave region empty.

- If **`fly`** is not recognized on Windows, use **`flyctl`** and ensure **`%USERPROFILE%\.fly\bin`** is on your **PATH**.
- If the app name **`hello-fly`** is taken globally on Fly, edit **`fly.toml`** and change **`app = "hello-fly"`** to a unique name.

Upstream quickstart (without this repo’s `fly.toml` fixes):

```sh
fly launch --now
```

---

The FightForge API for this project is deployed from **`../`** (parent **`backend/`**), not this tutorial copy.
