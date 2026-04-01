@echo off
SETLOCAL EnableDelayedExpansion

echo ----------------------------------------------------
echo BioNexus ML Project Launcher (Robust Edition)
echo ----------------------------------------------------

:: 1. Check for Python
python --version >nul 2>&1
if ERRORLEVEL 1 (
    echo [!] Python is not installed or not in PATH!
    pause
    exit /b 1
)

:: 2. Setup Virtual Environment for Backend
if not exist venv (
    echo [1/4] Creating virtual environment...
    python -m venv venv
)

echo [2/4] Activating venv and installing Python dependencies...
call venv\Scripts\activate
call pip install -r requirements.txt --quiet

:: 3. Node.js detection and setup
set "NODE_OK=0"
node --version >nul 2>&1
if not ERRORLEVEL 1 (
    set "NODE_OK=1"
) else (
    echo [!] Node.js not found. Attempting auto-install via winget...
    winget --version >nul 2>&1
    if not ERRORLEVEL 1 (
        echo [!] Installing Node.js LTS...
        winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
        if not ERRORLEVEL 1 (
            echo [!] Node.js installed. Refreshing PATH.
            set "PATH=%PATH%;C:\Program Files\nodejs"
            set "NODE_OK=1"
        )
    )
)

:: Secondary check if winget failed
if "%NODE_OK%"=="0" (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=%PATH%;C:\Program Files\nodejs"
        set "NODE_OK=1"
    )
)

if "%NODE_OK%"=="1" (
    echo [3/4] Node.js detected. Setting up React frontend...
    pushd app\react-frontend
    if not exist node_modules (
        echo [!] Running npm install...
        call npm install --no-fund --no-audit
    )
    popd
) else (
    echo [!] Warning: Node.js not found. 
    echo [!] Falling back to Vanilla JS mode.
)

:: 4. Launching
echo ----------------------------------------------------
echo [4/4] Starting project services...
echo ----------------------------------------------------

:: Start Backend
echo [!] Starting FastAPI backend on http://127.0.0.1:8000
set "PYTHONPATH=%CD%\app;%PYTHONPATH%"
start "BioNexus Backend" /B venv\Scripts\python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

:: Start Frontend if Node is OK
if "%NODE_OK%"=="1" (
    echo [!] Starting React frontend on http://localhost:5173
    pushd app\react-frontend
    start "BioNexus React Frontend" /B npm run dev
    popd
)

echo ----------------------------------------------------
echo [OK] Services launching.
echo      Interface: http://localhost:5173 (React) OR http://127.0.0.1:8000 (Vanilla)
echo ----------------------------------------------------
pause
