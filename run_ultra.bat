@echo off
title Voter Ultra Engine v2.0 - Orchestrator
echo ===================================================
echo   VOTER ULTRA ENGINE v2.0 - STARTUP SEQUENCE
echo ===================================================

:: Get the directory of the script
set BASE_DIR=%~dp0
cd /d %BASE_DIR%

echo [1/3] Launching FastAPI Backend...
:: Start backend in a new window
start "Voter Backend" cmd /c ".\venv\Scripts\python main.py"

echo [2/3] Launching React Frontend...
:: Navigate to frontend and start dev server in a new window
cd frontend
start "Voter Frontend" cmd /c "npm run dev"

echo [3/3] Finalizing Environment...
:: Wait for servers to initialize
timeout /t 5 /nobreak > nul

echo Opening dashboard at http://localhost:5173
start http://localhost:5173

echo ===================================================
echo   SYSTEM OPERATIONAL. Close the other windows to stop.
echo ===================================================
pause
