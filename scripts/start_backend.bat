@echo off
cd /d C:\Kiosk\backend
REM make sure node_modules installed
npm install
REM start node server (server.js listens on port 3000)
node app.js
