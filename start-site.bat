@echo off
title Happy Birthday, CY RAE
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto nonode
echo.
echo   Opening the birthday surprise at http://localhost:8080
echo   Keep this window open while the site is in use.
echo.
start "" cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:8080"
node serve.js
echo.
echo The server stopped.
pause
goto end
:nonode
echo Node.js was not found. Trying Python...
where py >nul 2>nul && start "" cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:8080" && py -m http.server 8080 && goto end
where python >nul 2>nul && start "" cmd /c "ping -n 2 127.0.0.1 >nul & start http://localhost:8080" && python -m http.server 8080 && goto end
echo.
echo Install Node.js from https://nodejs.org and double-click this file again.
pause
:end
