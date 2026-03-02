@echo off
title Barangay Biluso Print Agent
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║       BARANGAY BILUSO KIOSK - PRINT AGENT                ║
echo ║              XP-58 Thermal Printer Support               ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
)

:: Check if .env exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo.
    echo Please create a .env file with the following content:
    echo.
    echo WS_URL=wss://api.brgybiluso.me
    echo AGENT_SECRET=your-secure-agent-secret
    echo.
    copy ".env.example" ".env" >nul 2>nul
    echo Created .env from template. Please edit it with your settings.
    notepad .env
    pause
)

:: Start the print agent
echo [INFO] Starting Print Agent...
echo.
node index.js

:: If it exits, pause to see any error
echo.
echo [INFO] Print Agent stopped.
pause
