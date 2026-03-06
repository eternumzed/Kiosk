/**
 * Barangay Biluso Print Agent
 * 
 * This Windows application connects to the VPS backend via WebSocket
 * and handles print jobs for the XP-58 thermal printer.
 * 
 * Run this on the Windows machine where the XP-58 is installed.
 */

require("dotenv").config();
const WebSocket = require("ws");
const { printReceipt, listPrinters, testPrint } = require("./printService");

// Configuration
const WS_URL = process.env.WS_URL || "wss://api.brgybiluso.me";
const AGENT_SECRET = "Ncst12345";
const RECONNECT_INTERVAL = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

let ws = null;
let heartbeatTimer = null;
let reconnectTimer = null;

// Colorful console logging
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${new Date().toISOString()} - ${msg}`),
  print: (msg) => console.log(`\x1b[35m[PRINT]\x1b[0m ${new Date().toISOString()} - ${msg}`),
};

function connect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  log.info(`Connecting to ${WS_URL}...`);

  try {
    ws = new WebSocket(WS_URL, {
      headers: {
        "x-agent-type": "print-agent",
        "x-agent-secret": AGENT_SECRET,
      },
    });

    ws.on("open", handleOpen);
    ws.on("message", handleMessage);
    ws.on("close", handleClose);
    ws.on("error", handleError);
  } catch (err) {
    log.error(`Connection failed: ${err.message}`);
    scheduleReconnect();
  }
}

function handleOpen() {
  log.success("Connected to backend server!");
  
  // Send registration message
  sendMessage({
    type: "register",
    agentType: "print",
    agentSecret: AGENT_SECRET,
    capabilities: ["thermal-58mm", "escpos"],
  });

  // Start heartbeat
  startHeartbeat();
}

async function handleMessage(data) {
  try {
    const message = JSON.parse(data.toString());
    
    switch (message.type) {
      case "registered":
        log.success(`Agent registered successfully. ID: ${message.agentId}`);
        break;

      case "print-job":
        await handlePrintJob(message);
        break;

      case "test-print":
        await handleTestPrint(message);
        break;

      case "list-printers":
        await handleListPrinters(message);
        break;

      case "pong":
        // Heartbeat acknowledged
        break;

      case "error":
        log.error(`Server error: ${message.message}`);
        break;

      default:
        log.warn(`Unknown message type: ${message.type}`);
    }
  } catch (err) {
    log.error(`Failed to process message: ${err.message}`);
  }
}

async function handlePrintJob(message) {
  const { jobId, data, printerName } = message;
  
  log.print(`Received print job: ${jobId}`);
  log.print(`Document: ${data.document || "N/A"}`);
  log.print(`Reference: ${data.referenceNumber || "N/A"}`);

  try {
    const result = await printReceipt(data, printerName);
    
    if (result.success) {
      log.success(`Print job ${jobId} completed successfully`);
      sendMessage({
        type: "print-result",
        jobId,
        success: true,
        message: "Receipt printed successfully",
      });
    } else {
      log.error(`Print job ${jobId} failed: ${result.error}`);
      sendMessage({
        type: "print-result",
        jobId,
        success: false,
        error: result.error,
      });
    }
  } catch (err) {
    log.error(`Print job ${jobId} error: ${err.message}`);
    sendMessage({
      type: "print-result",
      jobId,
      success: false,
      error: err.message,
    });
  }
}

async function handleTestPrint(message) {
  log.print("Executing test print...");
  
  try {
    const result = await testPrint(message.printerName);
    sendMessage({
      type: "test-print-result",
      success: result.success,
      message: result.success ? "Test print successful" : result.error,
      printerUsed: result.printerName,
    });
  } catch (err) {
    sendMessage({
      type: "test-print-result",
      success: false,
      error: err.message,
    });
  }
}

async function handleListPrinters(message) {
  log.info("Listing available printers...");
  
  try {
    const printers = await listPrinters();
    log.info(`Found ${printers.length} printer(s)`);
    
    sendMessage({
      type: "printers-list",
      printers,
    });
  } catch (err) {
    sendMessage({
      type: "printers-list",
      printers: [],
      error: err.message,
    });
  }
}

function handleClose(code, reason) {
  log.warn(`Connection closed. Code: ${code}, Reason: ${reason || "Unknown"}`);
  stopHeartbeat();
  scheduleReconnect();
}

function handleError(err) {
  log.error(`WebSocket error: ${err.message}`);
}

function sendMessage(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    sendMessage({ type: "ping" });
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  
  log.info(`Reconnecting in ${RECONNECT_INTERVAL / 1000} seconds...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_INTERVAL);
}

// Graceful shutdown
process.on("SIGINT", () => {
  log.info("Shutting down print agent...");
  stopHeartbeat();
  if (ws) {
    ws.close(1000, "Agent shutdown");
  }
  process.exit(0);
});

process.on("SIGTERM", () => {
  log.info("Received SIGTERM, shutting down...");
  stopHeartbeat();
  if (ws) {
    ws.close(1000, "Agent shutdown");
  }
  process.exit(0);
});

// Startup
async function main() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       BARANGAY BILUSO KIOSK - PRINT AGENT v1.0.0         ║");
  console.log("║              XP-58 Thermal Printer Support               ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("\n");

  // List available printers on startup
  log.info("Scanning for printers...");
  try {
    const printers = await listPrinters();
    if (printers.length === 0) {
      log.warn("No printers found! Please install the XP-58 driver.");
    } else {
      log.info(`Found ${printers.length} printer(s):`);
      printers.forEach((p, i) => {
        const defaultTag = p.isDefault ? " (DEFAULT)" : "";
        console.log(`   ${i + 1}. ${p.name}${defaultTag}`);
      });
    }
  } catch (err) {
    log.error(`Failed to list printers: ${err.message}`);
  }

  console.log("\n");

  if (AGENT_SECRET === "your-secure-agent-secret") {
    log.warn("Using default AGENT_SECRET placeholder. Set AGENT_SECRET or PRINT_AGENT_SECRET in .env to match backend PRINT_AGENT_SECRET.");
  }
  
  // Connect to backend
  connect();
}

main();
