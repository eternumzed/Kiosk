@echo off
setlocal
title Barangay Biluso Kiosk Launcher
color 0A

echo.
echo ==============================================================
echo   BARANGAY BILUSO KIOSK LAUNCHER
echo   - Starts Edge in kiosk fullscreen
echo   - Starts print-agent ^(index.js^) for VPS to Windows printing
echo ==============================================================
echo.

REM Root path provided by deployment machine setup
set "ROOT_DIR=C:\Users\Lenovo\Desktop\Github\Kiosk"
set "PRINT_AGENT_DIR=%ROOT_DIR%\print-agent"
set "KIOSK_URL=https://kiosk.brgybiluso.me"

REM Resolve Edge path (stable/beta/dev/canary fallback)
set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"

if not exist "%ROOT_DIR%" (
    echo [ERROR] Root folder not found: %ROOT_DIR%
    pause
    exit /b 1
)

if not exist "%PRINT_AGENT_DIR%" (
    echo [ERROR] Print agent folder not found: %PRINT_AGENT_DIR%
    pause
    exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

if not exist "%EDGE_EXE%" (
    echo [ERROR] Microsoft Edge not found.
    echo Install Edge or update EDGE_EXE path in this BAT file.
    pause
    exit /b 1
)

pushd "%PRINT_AGENT_DIR%"

if not exist "node_modules" (
    echo [INFO] Installing print-agent dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed in %PRINT_AGENT_DIR%
        popd
        pause
        exit /b 1
    )
)

echo [INFO] Starting print agent in a new window...
start "BRGY Print Agent" cmd /k "cd /d ""%PRINT_AGENT_DIR%"" && node index.js"

echo [INFO] Launching Edge kiosk window...
start "BRGY Kiosk" "%EDGE_EXE%" ^
  --kiosk "%KIOSK_URL%" ^
  --edge-kiosk-type=fullscreen ^
  --no-first-run ^
  --no-default-browser-check ^
  --disable-features=msEdgeWelcomePage,EdgeWelcomePage,WelcomePage ^
  --disable-session-crashed-bubble ^
  --overscroll-history-navigation=0

popd

echo.
echo [OK] Kiosk and print agent launched.
echo You can close this launcher window.
timeout /t 3 /nobreak >nul
endlocal
exit /b 0
