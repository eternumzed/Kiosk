#!/bin/bash

echo "Starting all Kiosk services..."
echo ""

ROOT_PATH="Z:/Kiosk"
BACKEND_PATH="Z:/Kiosk/backend"
KIOSK_CLIENT_PATH="Z:/Kiosk/frontend/kiosk-client"
ADMIN_PATH="Z:/Kiosk/frontend/admin"
MOBILE_APP_PATH="Z:/Kiosk/frontend/mobile-app"

# Verify paths exist
echo "Verifying paths..."
if [ ! -d "$BACKEND_PATH" ]; then
    echo "ERROR: Backend path not found: $BACKEND_PATH"
    exit 1
fi
if [ ! -d "$KIOSK_CLIENT_PATH" ]; then
    echo "ERROR: Kiosk Client path not found: $KIOSK_CLIENT_PATH"
    exit 1
fi
if [ ! -d "$ADMIN_PATH" ]; then
    echo "ERROR: Admin path not found: $ADMIN_PATH"
    exit 1
fi
if [ ! -d "$MOBILE_APP_PATH" ]; then
    echo "ERROR: Mobile App path not found: $MOBILE_APP_PATH"
    exit 1
fi
echo "All paths verified!"
echo ""

# Function to start a service in a new Git Bash window (Using Mintty)
start_service() {
    local name=$1
    local path=$2
    local command=$3
    
    echo "[*] Starting $name..."
    
    # Convert Windows path to POSIX (/z/Kiosk/...)
    local posix_path=$(cygpath -u "$path")
    
    # Launch mintty (the default Git Bash terminal)
    # Using explicit path to bash to avoid WSL interference
    /usr/bin/mintty -t "$name" -e /usr/bin/bash -lc "cd '$posix_path' && echo 'Working directory: \$PWD' && $command; echo ''; echo 'Process finished. Press enter to close terminal.'; read" &
    
    sleep 2
}

# Start all services
echo "[1/6] Starting Backend API..."
start_service "Backend API" "Z:/Kiosk/backend" "npm run dev"

echo "[2/6] Starting Kiosk Client..."
start_service "Kiosk Client" "Z:/Kiosk/frontend/kiosk-client" "npm run dev"

echo "[3/6] Starting Admin Panel..."
start_service "Admin Panel" "Z:/Kiosk/frontend/admin" "npm run dev"

echo "[4/6] Starting Mobile App..."
start_service "Mobile App" "Z:/Kiosk/frontend/mobile-app" "npm start"

echo "[5/6] Starting Ngrok tunnel for Backend..."
/usr/bin/mintty -t "Ngrok" -e /usr/bin/bash -lc "ngrok http 5000; echo ''; echo 'Ngrok closed. Press enter to exit.'; read" &
sleep 2

echo "[6/6] Opening VS Code..."
code "Z:/Kiosk/"
sleep 1

echo ""
echo "=========================================="
echo "All services are starting up!"
echo "=========================================="
echo "Close any terminal window to stop that service."
echo ""
