<#
  나드리 로컬 개발 원클릭 실행 (Windows PowerShell)
  - 백엔드(naduri-backend)를 새 창에서 uvicorn 으로 실행
  - USB 실기기용 adb reverse (백엔드 8000 · Metro 8081) 설정
  - 프론트(Expo)를 이 창에서 실행

  위치: giwa_chain_app_front/scripts/run-dev.ps1

  사용법(프론트 레포 루트에서):
    ./scripts/run-dev.ps1                 # 백엔드 + 프론트 빌드/설치/실행(expo run:android)
    ./scripts/run-dev.ps1 -Start          # 이미 설치돼 있으면 Metro만(npm start, 빠름)
    ./scripts/run-dev.ps1 -NoBackend      # 백엔드는 이미 떠 있고 프론트만
    ./scripts/run-dev.ps1 -Py 3.12.13     # uv 파이썬 버전 지정(기본 3.12.12)
    ./scripts/run-dev.ps1 -Port 8000      # 백엔드 포트(기본 8000)
#>
[CmdletBinding()]
param(
  [switch]$Start,        # 프론트를 npm start(Metro만)로. 미지정 시 npm run android(빌드+설치)
  [switch]$NoBackend,    # 백엔드 실행 생략
  [string]$Py = "3.12.12",
  [int]$Port = 8000,
  [string]$BackendDir
)

$ErrorActionPreference = "Stop"
# 이 스크립트는 <front>/scripts 에 있다 → 프론트 루트는 상위, 백엔드는 그 형제 폴더.
$FrontDir = Split-Path $PSScriptRoot -Parent
if (-not $BackendDir) {
  $BackendDir = Join-Path (Split-Path $FrontDir -Parent) "naduri-backend"
}

function Info($m)  { Write-Host "[dev] $m" -ForegroundColor Cyan }
function Warn($m)  { Write-Host "[dev] $m" -ForegroundColor Yellow }

# ── 1) 백엔드 (새 창) ────────────────────────────────────────────────
if (-not $NoBackend) {
  if (-not (Test-Path $BackendDir)) {
    Warn "백엔드 폴더를 못 찾음: $BackendDir  → -BackendDir 로 지정하거나 -NoBackend 사용"
  } else {
    if (-not (Test-Path (Join-Path $BackendDir ".env"))) {
      Warn "$BackendDir\.env 가 없어요. .env.example 을 복사해 채워주세요(백엔드가 안 뜰 수 있음)."
    }
    Info "백엔드 실행(새 창): 127.0.0.1:$Port  (python $Py)"
    $backendCmd = "Set-Location '$BackendDir'; Write-Host '=== naduri-backend :$Port ===' -ForegroundColor Green; uv run --python $Py uvicorn app.main:app --host 127.0.0.1 --port $Port"
    Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd | Out-Null

    # health 대기(최대 ~40초)
    Info "백엔드 health 대기 중..."
    $ok = $false
    for ($i = 0; $i -lt 40; $i++) {
      try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 2 -UseBasicParsing
        if ($r.StatusCode -eq 200) { $ok = $true; break }
      } catch { Start-Sleep -Seconds 1 }
    }
    if ($ok) { Info "백엔드 OK (http://127.0.0.1:$Port/health)" }
    else { Warn "백엔드 health 응답 없음 — 새 창 로그를 확인하세요(계속 진행)." }
  }
}

# ── 2) adb reverse (USB 실기기: 폰 localhost → PC) ───────────────────
$adb = Get-Command adb -ErrorAction SilentlyContinue
if ($adb) {
  $devices = (& adb devices | Select-String "device$")
  if ($devices) {
    & adb reverse tcp:$Port tcp:$Port | Out-Null
    & adb reverse tcp:8081 tcp:8081 | Out-Null
    Info "adb reverse 설정: tcp:$Port(백엔드) · tcp:8081(Metro)"
  } else {
    Warn "연결된 안드로이드 기기가 없어요(adb). 에뮬레이터면 무시 가능."
  }
} else {
  Warn "adb 를 PATH 에서 못 찾음 — 실기기 USB 포워딩은 수동으로: adb reverse tcp:$Port tcp:$Port"
}

# ── 3) .env 점검(경고만) ────────────────────────────────────────────
$envFile = Join-Path $FrontDir ".env"
if (Test-Path $envFile) {
  $base = Select-String -Path $envFile -Pattern "EXPO_PUBLIC_API_BASE_URL=(.*)" -ErrorAction SilentlyContinue
  if ($base) { Info "프론트 API base: $($base.Matches[0].Groups[1].Value.Trim())" }
} else {
  Warn "$envFile 없음 — .env.example 복사 후 EXPO_PUBLIC_API_BASE_URL 설정 필요."
}

# ── 4) 프론트 (이 창) ───────────────────────────────────────────────
Set-Location $FrontDir
if ($Start) {
  Info "프론트: npm start (Metro만)"
  npm start
} else {
  Info "프론트: npm run android (빌드+설치+실행)"
  npm run android
}
