<#
.SYNOPSIS
  Creates the FightForge milestone, labels, and all task-split issues on GitLab.

.DESCRIPTION
  Reads $env:GITLAB_TOKEN for auth. Idempotent-ish:
    * Milestone is created if a milestone with the same title does not already exist.
    * Labels are created if missing; existing ones are left alone.
    * Issues are created unconditionally (GitLab allows duplicate titles), so only
      run this once unless you plan to clean up duplicates manually.

.USAGE
  $env:GITLAB_TOKEN = 'glpat-xxxxxxxxxxxxxxxxxxxx'
  pwsh -File .\scripts\create-gitlab-issues.ps1
  # or from PowerShell:
  .\scripts\create-gitlab-issues.ps1
#>

[CmdletBinding()]
param(
  [string]$BaseUrl       = 'https://git.las.iastate.edu/api/v4',
  [string]$ProjectPath   = 'se-coms-3190/spring-2026/final-project/al-4',
  [string]$MilestoneName = 'FightForge Final'
)

$ErrorActionPreference = 'Stop'

if (-not $env:GITLAB_TOKEN) {
  throw 'GITLAB_TOKEN env var is not set. Get a token with "api" scope from https://git.las.iastate.edu/-/user_settings/personal_access_tokens and run: $env:GITLAB_TOKEN = "glpat-..."'
}

$headers = @{ 'PRIVATE-TOKEN' = $env:GITLAB_TOKEN }
# GitLab project path must be URL-encoded when used in the API path.
$projectId = [uri]::EscapeDataString($ProjectPath)

function Invoke-GL {
  param(
    [Parameter(Mandatory)] [string]$Method,
    [Parameter(Mandatory)] [string]$Path,
    [hashtable]$Body
  )
  $uri = "$BaseUrl$Path"
  $params = @{
    Method  = $Method
    Uri     = $uri
    Headers = $headers
  }
  if ($Body) {
    $params.Body        = ($Body | ConvertTo-Json -Depth 6)
    $params.ContentType = 'application/json'
  }
  try {
    return Invoke-RestMethod @params
  } catch {
    Write-Host "API $Method $uri failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message -ForegroundColor DarkRed }
    throw
  }
}

# ---------- 1. Milestone ----------
Write-Host "Ensuring milestone '$MilestoneName'..." -ForegroundColor Cyan
$existing = Invoke-GL -Method GET -Path "/projects/$projectId/milestones?search=$([uri]::EscapeDataString($MilestoneName))"
$milestone = $existing | Where-Object { $_.title -eq $MilestoneName } | Select-Object -First 1
if (-not $milestone) {
  $milestone = Invoke-GL -Method POST -Path "/projects/$projectId/milestones" -Body @{
    title       = $MilestoneName
    description = 'Final project deliverables for FightForge (SE COM S 3190 — Spring 2026).'
  }
  Write-Host "  created milestone id=$($milestone.id)" -ForegroundColor Green
} else {
  Write-Host "  milestone already exists, id=$($milestone.id)" -ForegroundColor Yellow
}
$milestoneId = $milestone.id

# ---------- 2. Labels ----------
$labels = @(
  @{ name = 'area::backend';   color = '#1f75cb' },
  @{ name = 'area::frontend';  color = '#6699cc' },
  @{ name = 'area::shared';    color = '#a8d1e7' },
  @{ name = 'owner::craig';    color = '#cc338b' },
  @{ name = 'owner::tucker';   color = '#fc9403' },
  @{ name = 'owner::shared';   color = '#808080' }
)
Write-Host 'Ensuring labels...' -ForegroundColor Cyan
$existingLabels = Invoke-GL -Method GET -Path "/projects/$projectId/labels?per_page=100"
foreach ($lbl in $labels) {
  if ($existingLabels.name -contains $lbl.name) {
    Write-Host "  label '$($lbl.name)' exists" -ForegroundColor Yellow
  } else {
    Invoke-GL -Method POST -Path "/projects/$projectId/labels" -Body $lbl | Out-Null
    Write-Host "  created label '$($lbl.name)'" -ForegroundColor Green
  }
}

# ---------- 3. Issue data ----------
# Each issue: code, title, description (markdown), labels
$issues = @(
  # Shared
  @{ code='S1'; title='[S1] Repo structure (frontend, backend, .env.example)';
     labels='area::shared,owner::shared';
     desc=@"
Scaffold `frontend/` (Vite + React) and `backend/` (Express), wire `.env.example` for backend config.

**Done when:** both apps run via `npm run dev` / `npm start`, environment vars are documented.
"@ }

  @{ code='S2'; title='[S2] MySQL schema + schema.sql';
     labels='area::shared,owner::shared';
     desc=@"
Define `users`, `workouts`, `meals`, `progress_entries`, `messages` with agreed FKs and `ENUM('athlete','coach','admin')` roles.

**Location:** `backend/database/schema.sql`
"@ }

  @{ code='S3'; title='[S3] JWT auth contract + Bearer middleware';
     labels='area::shared,owner::shared';
     desc=@"
Shared `signToken` / `authenticate` / `requireRole` middleware in `backend/middleware/auth.js`. Both Craig and Tucker's routes consume the same contract.
"@ }

  @{ code='S4'; title='[S4] CORS + Vite /api proxy';
     labels='area::shared,owner::shared';
     desc=@"
Backend CORS set to the dev frontend origin. Vite `server.proxy` sends `/api` to `http://127.0.0.1:5000` for local development.
"@ }

  @{ code='S5'; title='[S5] Seed script for demo accounts';
     labels='area::shared,owner::shared';
     desc=@"
`backend/scripts/seed.js` inserts admin, coach, and demo athlete (coach-assigned) plus sample workouts & progress entries. Shared password `Password123!`.
"@ }

  @{ code='S6'; title='[S6] README install / env / run docs';
     labels='area::shared,owner::shared';
     desc=@"
Top-level `README.md` covering prerequisites, MySQL import, env setup, and `npm` scripts for both apps. Course submission requirement.
"@ }

  # Craig — backend
  @{ code='CB1'; title='[CB1] Backend - Authentication API';
     labels='area::backend,owner::craig';
     desc=@"
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile/:id`

**Acceptance:** bcrypt-hashed passwords, duplicate-email handling, JWT issued with role claim, 401/403 on protected routes, consistent JSON error shape.

**Branch:** `feat/backend-auth-api`
"@ }

  @{ code='CB2'; title='[CB2] Backend - Workout API (RBAC)';
     labels='area::backend,owner::craig';
     desc=@"
- `GET /api/workouts`
- `POST /api/workouts`
- `GET /api/workouts/:id`
- `PUT /api/workouts/:id`
- `DELETE /api/workouts/:id`

**RBAC:** coach/admin can create/update; athletes only see their own.

**Branch:** `feat/backend-workout-api`
"@ }

  @{ code='CB3'; title='[CB3] Backend - Progress API (RBAC)';
     labels='area::backend,owner::craig';
     desc=@"
- `GET /api/progress/:userId`
- `POST /api/progress`
- `PUT /api/progress/:id`
- `DELETE /api/progress/:id`

**RBAC:** athletes log their own; coach/admin manage their assigned athletes.

**Branch:** `feat/backend-progress-api`
"@ }

  # Craig — frontend
  @{ code='CF1'; title='[CF1] Frontend - Home';
     labels='area::frontend,owner::craig';
     desc=@"
Landing page with feature overview and login/signup entry points. Adapts when the user is already authenticated.

**Branch:** `feat/frontend-home`
"@ }

  @{ code='CF2'; title='[CF2] Frontend - Login';
     labels='area::frontend,owner::craig';
     desc=@"
Login form hitting `/api/auth/login`, stores JWT, and redirects based on role (`athlete` -> `/dashboard`, coach/admin -> `/workouts`).

**Branch:** `feat/frontend-login`
"@ }

  @{ code='CF3'; title='[CF3] Frontend - Athlete dashboard';
     labels='area::frontend,owner::craig';
     desc=@"
Hub showing workout summary + latest progress entry. Data pulled from `/api/workouts` and `/api/progress/:userId`.

**Branch:** `feat/frontend-athlete-dashboard`
"@ }

  @{ code='CF4'; title='[CF4] Frontend - Workouts page';
     labels='area::frontend,owner::craig';
     desc=@"
List + detail view. Coach/admin get create + delete controls. Loading and empty states included.

**Branch:** `feat/frontend-workouts-ui`
"@ }

  @{ code='CF5'; title='[CF5] Frontend - Progress page';
     labels='area::frontend,owner::craig';
     desc=@"
Log new check-ins (weight, body fat, bench, squat, cardio, notes). Athletes see their own history; coach/admin select an athlete via dropdown.

**Branch:** `feat/frontend-progress-ui`
"@ }

  @{ code='CF6'; title='[CF6] Frontend - Shared shell / 404';
     labels='area::frontend,owner::craig';
     desc=@"
`AppShell` layout (role-aware nav), `ProtectedRoute`, `AuthContext`, global CSS, and `NotFound` page.

**Branch:** `feat/shared-setup`
"@ }

  # Tucker — backend
  @{ code='TB1'; title='[TB1] Backend - User API (RBAC)';
     labels='area::backend,owner::tucker';
     desc=@"
- `GET /api/users` (admin; optional coach-filtered list)
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

**RBAC:** admin full; coach read-only for their athletes; athlete self only.
"@ }

  @{ code='TB2'; title='[TB2] Backend - Meal plan API (RBAC)';
     labels='area::backend,owner::tucker';
     desc=@"
- `GET /api/meals`
- `POST /api/meals`
- `GET /api/meals/:id`
- `PUT /api/meals/:id`
- `DELETE /api/meals/:id`

**RBAC:** coach/admin create/edit; athlete sees their assigned plans.
"@ }

  @{ code='TB3'; title='[TB3] Backend - Messaging API (RBAC)';
     labels='area::backend,owner::tucker';
     desc=@"
- `GET /api/messages`
- `GET /api/messages/:id`
- `POST /api/messages`
- `DELETE /api/messages/:id`

**RBAC:** users see only threads they're part of; admin can moderate.

Route is not mounted in `backend/server.js` until this issue is done.
"@ }

  # Tucker — frontend
  @{ code='TF1'; title='[TF1] Frontend - Signup';
     labels='area::frontend,owner::tucker';
     desc=@"
Registration form -> `POST /api/auth/signup`. Client-side validation (email, password length, confirm match) and friendly error messaging.
"@ }

  @{ code='TF2'; title='[TF2] Frontend - Meal plan page';
     labels='area::frontend,owner::tucker';
     desc=@"
Display meal plans from `/api/meals`. Coach/admin create + edit controls. Consistent with Workouts page layout.
"@ }

  @{ code='TF3'; title='[TF3] Frontend - Chat page';
     labels='area::frontend,owner::tucker';
     desc=@"
Thread or inbox UI backed by the Messaging API. Compose + send; mark read optional.
"@ }

  @{ code='TF4'; title='[TF4] Frontend - Coach dashboard';
     labels='area::frontend,owner::tucker';
     desc=@"
Assigned athletes list with shortcuts to assign workouts/meals and open messages. Reuses Craig's workout APIs and your meal/message APIs.
"@ }

  @{ code='TF5'; title='[TF5] Frontend - Admin dashboard';
     labels='area::frontend,owner::tucker';
     desc=@"
User CRUD plus cross-entity management per proposal ("full CRUD"). Confirm dialogs on destructive actions.
"@ }

  @{ code='TF6'; title='[TF6] Frontend - Error pages';
     labels='area::frontend,owner::tucker';
     desc=@"
Shared API-failure + 500 messaging. 404 page already exists (CF6) - split ownership: general error boundary + toast lives here.
"@ }
)

# ---------- 4. Create issues ----------
Write-Host "Creating $($issues.Count) issues..." -ForegroundColor Cyan
$created = @()
foreach ($i in $issues) {
  $body = @{
    title        = $i.title
    description  = $i.desc
    labels       = $i.labels
    milestone_id = $milestoneId
  }
  $res = Invoke-GL -Method POST -Path "/projects/$projectId/issues" -Body $body
  Write-Host ("  #{0,-3} [{1}] -> {2}" -f $res.iid, $i.code, $res.web_url) -ForegroundColor Green
  $created += [pscustomobject]@{ code = $i.code; iid = $res.iid; url = $res.web_url }
}

Write-Host ''
Write-Host "Done. Created $($created.Count) issues under milestone '$MilestoneName'." -ForegroundColor Cyan
$created | Format-Table -AutoSize
