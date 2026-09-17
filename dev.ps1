<#
Starts the whole app with one command: backend (FastAPI), frontend (Vite), and the
video-factory engine, each in its own window so logs stay readable and any one of
them can be stopped (Ctrl+C in its window) without killing the others.

Usage:
  .\dev.ps1                 # backend + frontend + video engine
  .\dev.ps1 -NoVideoEngine  # skip the video engine (not needed unless you're testing
                             # on-demand video generation)
#>
param(
    [switch]$NoVideoEngine
)

$root = $PSScriptRoot

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; python -m uvicorn main:app --port 8001 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev"

if (-not $NoVideoEngine) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\video-factory'; npx tsx apps/pipeline/src/server.ts"
}

Write-Host ""
Write-Host "Started in separate windows:"
Write-Host "  Backend:       http://127.0.0.1:8001"
Write-Host "  Frontend:      http://localhost:5173"
if (-not $NoVideoEngine) {
    Write-Host "  Video engine:  http://127.0.0.1:5050"
}
Write-Host ""
Write-Host "Close this window any time -- the three above keep running independently."
Write-Host "To stop everything, close each of their windows (or Ctrl+C in each)."
