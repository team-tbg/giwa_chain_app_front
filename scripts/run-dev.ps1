<#
  Naduri local dev one-shot runner (Windows PowerShell)
    - starts backend (naduri-backend) in a new window via uvicorn
    - sets adb reverse for USB device (backend 8000, Metro 8081)
    - runs the frontend (Expo) in this window

  Location: giwa_chain_app_front/scripts/run-dev.ps1

  Usage (from the frontend repo root):
    ./scripts/run-dev.ps1                 # backend + frontend build/install/run (expo run:android)
    ./scripts/run-dev.ps1 -Start          # Metro only (npm start) if the app is already installed
    ./scripts/run-dev.ps1 -NoBackend      # frontend only (backend already up)
    ./scripts/run-dev.ps1 -Py 3.12.13     # uv python version (default 3.12.12)
    ./scripts/run-dev.ps1 -Port 8000      # backend port (default 8000)

  NOTE: messages are ASCII on purpose. Windows PowerShell 5.1 reads .ps1 as the
  system codepage (CP949 on KR Windows) unless the file has a UTF-8 BOM, which
  garbles non-ASCII literals in the console. Keep console output ASCII.
#>
[CmdletBinding()]
param(
  [switch]$Start,        # frontend via npm start (Metro only). Default: npm run android (build+install)
  [switch]$NoBackend,    # skip backend
  [string]$Py = "3.12.12",
  [int]$Port = 8000,
  [string]$BackendDir
)

$ErrorActionPreference = "Stop"
# This script lives in <front>/scripts -> front root is the parent, backend is its sibling.
$FrontDir = Split-Path $PSScriptRoot -Parent
if (-not $BackendDir) {
  $BackendDir = Join-Path (Split-Path $FrontDir -Parent) "naduri-backend"
}

function Info($m) { Write-Host "[dev] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[dev] $m" -ForegroundColor Yellow }

# -- 1) backend (new window) -----------------------------------------
if (-not $NoBackend) {
  if (-not (Test-Path $BackendDir)) {
    Warn "backend folder not found: $BackendDir  -> pass -BackendDir or use -NoBackend"
  } else {
    if (-not (Test-Path (Join-Path $BackendDir ".env"))) {
      Warn "$BackendDir\.env missing. Copy .env.example and fill it (backend may fail to start)."
    }
    Info "starting backend (new window): 127.0.0.1:$Port  (python $Py)"
    $backendCmd = "Set-Location '$BackendDir'; Write-Host '=== naduri-backend :$Port ===' -ForegroundColor Green; uv run --python $Py uvicorn app.main:app --host 127.0.0.1 --port $Port"
    Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null

    # wait for health (up to ~40s)
    Info "waiting for backend health..."
    $ok = $false
    for ($i = 0; $i -lt 40; $i++) {
      try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 2 -UseBasicParsing
        if ($r.StatusCode -eq 200) { $ok = $true; break }
      } catch { Start-Sleep -Seconds 1 }
    }
    if ($ok) { Info "backend OK (http://127.0.0.1:$Port/health)" }
    else { Warn "no backend health response - check the new window's log (continuing)." }
  }
}

# -- 2) adb reverse (USB device: phone localhost -> PC) ---------------
$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($adb) {
  $devices = (& adb devices | Select-String "device$")
  if ($devices) {
    & adb reverse tcp:$Port tcp:$Port | Out-Null
    & adb reverse tcp:8081 tcp:8081 | Out-Null
    Info "adb reverse set: tcp:$Port (backend), tcp:8081 (Metro)"
  } else {
    Warn "no connected android device (adb). Fine if you use an emulator."
  }
} else {
  Warn "adb not on PATH - set USB forwarding manually: adb reverse tcp:$Port tcp:$Port"
}

# -- 3) .env check (warn only) ---------------------------------------
$envFile = Join-Path $FrontDir ".env"
if (Test-Path $envFile) {
  $base = Select-String -Path $envFile -Pattern "EXPO_PUBLIC_API_BASE_URL=(.*)" -ErrorAction SilentlyContinue
  if ($base) { Info "frontend API base: $($base.Matches[0].Groups[1].Value.Trim())" }
} else {
  Warn "$envFile missing - copy .env.example and set EXPO_PUBLIC_API_BASE_URL."
}

# -- 4) frontend (this window) ---------------------------------------
Set-Location $FrontDir
if ($Start) {
  Info "frontend: npm start (Metro only)"
  npm start
} else {
  Info "frontend: npm run android (build+install+run)"
  npm run android
}
