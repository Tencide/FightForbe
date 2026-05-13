#Requires -Version 5.1
<#
  Bypasses broken `fly launch` / empty region on some Windows flyctl builds.

  From backend/:
    pwsh -File scripts/fly-first-deploy.ps1

  1) Creates the Fly app from fly.toml `app = "..."` if it does not exist
  2) flyctl deploy --primary-region iad

  Requires: flyctl auth login
#>

$ErrorActionPreference = 'Stop'
$fly =
  if (Test-Path (Join-Path $env:USERPROFILE '.fly\bin\flyctl.exe')) {
    Join-Path $env:USERPROFILE '.fly\bin\flyctl.exe'
  } else {
    'flyctl'
  }

$backendDir = Split-Path $PSScriptRoot -Parent
Push-Location $backendDir
try {
  Write-Host "Working directory: $(Get-Location)"
  $toml = Join-Path $backendDir 'fly.toml'
  if (-not (Test-Path $toml)) { Write-Error 'Missing backend/fly.toml' }

  $line = (Get-Content $toml -Raw) -split "`n" | Where-Object { $_ -match '^\s*app\s*=' } | Select-Object -First 1
  if (-not $line -or $line -notmatch 'app\s*=\s*"([^"]+)"') {
    Write-Error 'Could not parse app name from fly.toml (expected app = "fightforge-api").'
  }
  $appName = $Matches[1]

  Write-Host "App name: $appName"
  Write-Host "Creating app (ignore error if it already exists)..."
  & $fly apps create $appName --save -y
  if ($LASTEXITCODE -ne 0) {
    Write-Host "apps create exited $LASTEXITCODE — continuing if app already exists."
  }

  Write-Host "Deploying with --primary-region iad ..."
  & $fly deploy --primary-region iad
} finally {
  Pop-Location
}
