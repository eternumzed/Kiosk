@echo off
REM Simple batch file to run the bash startup script using Git Bash explicitly
REM This avoids picking up WSL bash which might be in the system path

cd /d Z:\Kiosk
"C:\Program Files\Git\bin\bash.exe" --login -i -c "./start-all.sh"
pause
