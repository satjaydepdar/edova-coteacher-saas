<#
Starts the whole app with one command: backend (FastAPI), frontend (Vite), the
video-factory engine, and edova-reasoner, each in its own window so logs stay
readable and any one of them can be stopped (Ctrl+C in its window) without
killing the others.

edova-reasoner is a sibling checkout (..\edova-reasoner) -- it's what Next
Problem/Custom Problem call for step-by-step trig derivations; without it
those calls 503.

Usage:
  .\dev.ps1                 # backend + frontend + video engine + reasoner
  .\dev.ps1 -NoVideoEngine  # skip the video engine (not needed unless you're testing
                             # on-demand video generation)
  .\dev.ps1 -NoReasoner     # skip edova-reasoner (Next Problem/Custom Problem will 503)
#>
param(
    [switch]$NoVideoEngine,
    [switch]$NoReasoner
)

$root = $PSScriptRoot
$reasonerRoot = Join-Path $root "..\edova-reasoner\backend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn main:app --port 8001 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

if (-not $NoVideoEngine) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\video-factory'; npx tsx apps/pipeline/src/server.ts"
}

if (-not $NoReasoner) {
    if (Test-Path $reasonerRoot) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$reasonerRoot'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
    } else {
        Write-Host "Skipping edova-reasoner: not found at $reasonerRoot"
    }
}

Write-Host ""
Write-Host "Started in separate windows:"
Write-Host "  Backend:       http://127.0.0.1:8001"
Write-Host "  Frontend:      http://localhost:5173"
if (-not $NoVideoEngine) {
    Write-Host "  Video engine:  http://127.0.0.1:5050"
}
if ((-not $NoReasoner) -and (Test-Path $reasonerRoot)) {
    Write-Host "  Reasoner:      http://127.0.0.1:8000"
}
Write-Host ""
Write-Host "Close this window any time -- the windows above keep running independently."
Write-Host "To stop everything, close each of their windows (or Ctrl+C in each)."
