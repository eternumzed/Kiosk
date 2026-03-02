# Barangay Biluso Print Agent

A Windows application that connects to the VPS backend via WebSocket and handles print jobs for the XP-58 thermal receipt printer.

## Overview

Since the Kiosk backend runs on a Linux VPS (which cannot print to local Windows printers), this Print Agent acts as a bridge:

```
[Kiosk App] → [VPS Backend (Linux)] → [WebSocket] → [Print Agent (Windows)] → [XP-58 Printer]
```

## Requirements

- **Windows 10/11** (with PowerShell 5.1+)
- **Node.js 18+** installed
- **Xprinter XP-58** driver installed and printer configured
- **Network connection** to the VPS

## Installation

### 1. Install the XP-58 Printer Driver

1. Download the XP-58 driver from Xprinter's website or use the included CD
2. Connect the printer via USB
3. Install the driver following the manufacturer's instructions
4. Verify the printer appears in `Settings > Devices > Printers & scanners`

### 2. Set Up the Print Agent

```bash
# Navigate to the print-agent directory
cd print-agent

# Install dependencies
npm install

# Create configuration file
copy .env.example .env
```

### 3. Configure the Agent

Edit the `.env` file:

```env
# WebSocket URL of the backend server
WS_URL=wss://api.brgybiluso.me

# Secret key (must match PRINT_AGENT_SECRET on the server)
AGENT_SECRET=your-secure-agent-secret-change-this
```

### 4. Configure the Backend

Add to your VPS `.env` file:

```env
# Print Agent Secret (must match AGENT_SECRET on the Windows machine)
PRINT_AGENT_SECRET=your-secure-agent-secret-change-this
```

## Running the Print Agent

### Option 1: Using the Batch File (Recommended)

Double-click `START-PRINT-AGENT.bat`

### Option 2: Command Line

```bash
cd print-agent
npm start
```

### Option 3: Run at Windows Startup

1. Press `Win + R`, type `shell:startup`, press Enter
2. Create a shortcut to `START-PRINT-AGENT.bat` in that folder

## Verifying Connection

When the Print Agent starts successfully, you should see:

```
╔══════════════════════════════════════════════════════════╗
║       BARANGAY BILUSO KIOSK - PRINT AGENT v1.0.0         ║
║              XP-58 Thermal Printer Support               ║
╚══════════════════════════════════════════════════════════╝

[INFO] Scanning for printers...
[INFO] Found 1 printer(s):
   1. XP-58 (DEFAULT)

[INFO] Connecting to wss://api.brgybiluso.me...
[SUCCESS] Connected to backend server!
[SUCCESS] Agent registered successfully. ID: abc123def456
```

## API Endpoints

The backend exposes these print-related endpoints:

### Check Print Status
```bash
GET /api/print/status
```

Response:
```json
{
  "platform": "linux",
  "agentsConnected": 1,
  "printAvailable": true,
  "message": "Print agent connected and ready"
}
```

### Print Receipt
```bash
POST /api/print
Content-Type: application/json

{
  "referenceNumber": "BRG-2026-001234",
  "document": "Barangay Clearance",
  "status": "Processing",
  "fullName": "Juan Dela Cruz",
  "email": "juan@email.com",
  "phone": "09171234567",
  "amount": 50.00,
  "paymentStatus": "Paid",
  "paymentMethod": "GCash"
}
```

### Test Print
```bash
POST /api/print/test
```

## Troubleshooting

### "No printer found"
- Ensure the XP-58 driver is installed
- Check if the printer appears in Windows Printers & Scanners
- Try setting the XP-58 as the default printer

### "Connection failed"
- Verify the `WS_URL` is correct in `.env`
- Check if the VPS is running and accessible
- Ensure your firewall allows outbound WebSocket connections

### "Invalid agent secret"
- Make sure `AGENT_SECRET` in Print Agent `.env` matches `PRINT_AGENT_SECRET` in VPS `.env`

### Receipt not printing correctly
- Ensure the printer is set to 58mm paper width
- Check that ESC/POS mode is enabled (default for XP-58)
- Verify the printer's code page setting (CP437 recommended)

## Security

- The `AGENT_SECRET` prevents unauthorized devices from connecting
- Use a strong, unique secret (32+ characters recommended)
- Change the secret if you suspect it's been compromised
- The WebSocket connection uses TLS (wss://) for encryption

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     VPS (Linux/Ubuntu)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │               Express.js Backend                     │    │
│  │  ┌──────────────┐    ┌─────────────────────────┐   │    │
│  │  │ Print Route  │───▶│ WebSocket Handler       │   │    │
│  │  └──────────────┘    │ - sendPrintJob()        │   │    │
│  │                      │ - isPrintAgentAvailable │   │    │
│  │                      └──────────┬──────────────┘   │    │
│  └─────────────────────────────────┼──────────────────┘    │
└───────────────────────────────────┬┼────────────────────────┘
                                    │▼
                               WebSocket (wss://)
                                    │▲
┌───────────────────────────────────┴┼────────────────────────┐
│                Windows Machine (Kiosk Counter)               │
│  ┌─────────────────────────────────┼──────────────────┐     │
│  │              Print Agent        │                   │     │
│  │  ┌─────────────────────────────┴─────────────────┐ │     │
│  │  │ index.js - WebSocket Client                   │ │     │
│  │  │ - Receives print-job messages                 │ │     │
│  │  │ - Calls printService.printReceipt()           │ │     │
│  │  └─────────────────────┬─────────────────────────┘ │     │
│  │  ┌─────────────────────▼─────────────────────────┐ │     │
│  │  │ printService.js                               │ │     │
│  │  │ - buildReceiptPayload() ESC/POS commands      │ │     │
│  │  │ - sendToPrinter() via Windows API             │ │     │
│  │  └─────────────────────┬─────────────────────────┘ │     │
│  └────────────────────────┼─────────────────────────────     │
│                           ▼                                  │
│                    ┌──────────────┐                          │
│                    │  XP-58 USB   │                          │
│                    │  Thermal     │                          │
│                    │  Printer     │                          │
│                    └──────────────┘                          │
└──────────────────────────────────────────────────────────────┘
```

## Files

- `index.js` - Main application (WebSocket client)
- `printService.js` - Printer operations and ESC/POS formatting
- `package.json` - Dependencies
- `.env` - Configuration (create from `.env.example`)
- `START-PRINT-AGENT.bat` - Windows startup script

## License

Barangay Biluso Kiosk System © 2026
