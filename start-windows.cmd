@echo off
rem Double-click to install dependencies (first run only) and start the site at http://localhost:5173
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org, then double-click this file again.
  pause
  exit /b 1
)
for /f "tokens=1 delims=v." %%a in ('node -v') do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 22 (
  echo Node.js 22 or newer is required. You have:
  node -v
  echo Install the LTS version from https://nodejs.org, then try again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies, this takes about a minute the first time...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Copy the messages above and send them to Claude.
    pause
    exit /b 1
  )
)
echo Starting the site. Your browser will open at http://localhost:5173 - keep this window open; close it to stop the site.
start "" http://localhost:5173
call npm run dev
pause
