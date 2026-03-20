/**
 * WebSocket Handler for Print Agent Communication
 * 
 * Manages WebSocket connections from print agents and allows
 * the backend to send print jobs to connected Windows print agents.
 */

const WebSocket = require("ws");
const crypto = require("crypto");
const queueService = require("./queueService");

// Configuration
// Canonical variable is AGENT_SECRET; PRINT_AGENT_SECRET remains for backward compatibility.
const AGENT_SECRET = "Ncst12345";  

// Store connected print agents
const printAgents = new Map();
const queueClients = new Set();
const assistanceClients = new Set();

// Store pending print jobs
const pendingJobs = new Map();

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
function initWebSocket(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: "/", // Accept connections on root path for wss://api.brgybiluso.me
  });

  console.log(">> WebSocket server initialized for print agents");

  wss.on("connection", (ws, req) => {
    const agentSecret = req.headers["x-agent-secret"];
    const agentType = req.headers["x-agent-type"];

    // Validate connection
    if (agentType !== "print-agent") {
      console.log("[WS] Non-agent connection, allowing as regular client");
    }

    ws.isAuthenticated = false;
    ws.agentId = null;
    ws.isAlive = true;
    ws.isQueueSubscriber = false;
    ws.isAssistanceSubscriber = false;

    ws.on("message", (data) => handleMessage(ws, data));
    ws.on("close", () => handleDisconnect(ws));
    ws.on("error", (err) => console.error("[WS] Error:", err.message));
    ws.on("pong", () => {
      ws.isAlive = true;
    });


  });

  // Heartbeat to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log(`[WS] Terminating inactive agent: ${ws.agentId}`);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(interval));

  return wss;
}

/**
 * Handle incoming WebSocket messages
 */
function handleMessage(ws, data) {
  try {
    const message = JSON.parse(data.toString());

    switch (message.type) {
      case "register":
        handleRegister(ws, message);
        break;

      case "print-result":
        handlePrintResult(message);
        break;

      case "test-print-result":
        handleTestPrintResult(message);
        break;

      case "printers-list":
        handlePrintersList(message);
        break;

      case "ping":
        ws.isAlive = true;
        ws.send(JSON.stringify({ type: "pong" }));
        break;

      case "subscribe-queue":
        handleQueueSubscribe(ws);
        break;

      case "unsubscribe-queue":
        handleQueueUnsubscribe(ws);
        break;

      case "subscribe-assistance":
        handleAssistanceSubscribe(ws);
        break;

      case "unsubscribe-assistance":
        handleAssistanceUnsubscribe(ws);
        break;

      default:
        console.log(`[WS] Unknown message type: ${message.type}`);
    }
  } catch (err) {
    console.error("[WS] Failed to parse message:", err.message);
  }
}

async function handleQueueSubscribe(ws) {
  ws.isQueueSubscriber = true;
  queueClients.add(ws);

  ws.send(JSON.stringify({
    type: "queue-subscribed",
    ok: true,
  }));

  await sendQueueSnapshot(ws);
}

function handleQueueUnsubscribe(ws) {
  ws.isQueueSubscriber = false;
  queueClients.delete(ws);
}

function handleAssistanceSubscribe(ws) {
  ws.isAssistanceSubscriber = true;
  assistanceClients.add(ws);

  ws.send(JSON.stringify({
    type: "assistance-subscribed",
    ok: true,
  }));
}

function handleAssistanceUnsubscribe(ws) {
  ws.isAssistanceSubscriber = false;
  assistanceClients.delete(ws);
}

async function sendQueueSnapshot(ws) {
  try {
    const snapshot = await queueService.getQueueSnapshot();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "queue-update",
        payload: snapshot,
      }));
    }
  } catch (err) {
    console.error("[WS] Failed to send queue snapshot:", err.message);
  }
}

async function broadcastQueueUpdate() {
  if (!queueClients.size) return;

  try {
    const snapshot = await queueService.getQueueSnapshot();
    const message = JSON.stringify({
      type: "queue-update",
      payload: snapshot,
    });

    queueClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } catch (err) {
    console.error("[WS] Failed to broadcast queue update:", err.message);
  }
}

function broadcastAssistanceAlert(payload = {}) {
  if (!assistanceClients.size) return;

  const message = JSON.stringify({
    type: "assistance-alert",
    payload: {
      ...payload,
      requestedAt: payload.requestedAt || new Date().toISOString(),
    },
  });

  assistanceClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Handle print agent registration
 */
function handleRegister(ws, message) {
  const { agentSecret, capabilities } = message;

  if (agentSecret !== AGENT_SECRET) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid agent secret" }));
    ws.close(4001, "Unauthorized");
    return;
  }

  const agentId = crypto.randomBytes(8).toString("hex");
  ws.isAuthenticated = true;
  ws.agentId = agentId;
  ws.capabilities = capabilities || [];
  ws.isAlive = true;

  printAgents.set(agentId, ws);

  console.log(`[WS] Print agent registered: ${agentId}`);
  console.log(`[WS] Capabilities: ${capabilities?.join(", ") || "none"}`);
  console.log(`[WS] Total connected agents: ${printAgents.size}`);

  ws.send(JSON.stringify({
    type: "registered",
    agentId,
    message: "Successfully registered as print agent"
  }));
}

/**
 * Handle print job result from agent
 */
function handlePrintResult(message) {
  const { jobId, success, error } = message;
  
  const callback = pendingJobs.get(jobId);
  if (callback) {
    callback(success, error);
    pendingJobs.delete(jobId);
    console.log(`[WS] Print job ${jobId} completed: ${success ? "SUCCESS" : "FAILED"}`);
  }
}

/**
 * Handle test print result
 */
function handleTestPrintResult(message) {
  console.log(`[WS] Test print result: ${message.success ? "SUCCESS" : "FAILED"}`);
  if (message.printerUsed) {
    console.log(`[WS] Printer used: ${message.printerUsed}`);
  }
}

/**
 * Handle printers list from agent
 */
function handlePrintersList(message) {
  console.log("[WS] Available printers on agent:");
  message.printers?.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}${p.isDefault ? " (DEFAULT)" : ""}`);
  });
}

/**
 * Handle agent disconnect
 */
function handleDisconnect(ws) {
  if (ws.isQueueSubscriber) {
    queueClients.delete(ws);
  }

  if (ws.isAssistanceSubscriber) {
    assistanceClients.delete(ws);
  }

  if (ws.agentId) {
    printAgents.delete(ws.agentId);
    console.log(`[WS] Print agent disconnected: ${ws.agentId}`);
    console.log(`[WS] Remaining agents: ${printAgents.size}`);
  }
}

/**
 * Send a print job to an available print agent
 * @param {object} data - Print job data
 * @param {string} printerName - Optional specific printer name
 * @returns {Promise<{success: boolean, error?: string}>}
 */
function sendPrintJob(data, printerName = null) {
  return new Promise((resolve, reject) => {
    // Find an available authenticated agent
    const agent = Array.from(printAgents.values()).find(ws => 
      ws.isAuthenticated && ws.readyState === WebSocket.OPEN
    );

    if (!agent) {
      return resolve({ 
        success: false, 
        error: "No print agent connected. Please start the print agent on the Windows machine." 
      });
    }

    const jobId = crypto.randomBytes(16).toString("hex");
    
    // Store callback for when we receive the result
    pendingJobs.set(jobId, (success, error) => {
      resolve({ success, error });
    });

    // Set timeout for job
    setTimeout(() => {
      if (pendingJobs.has(jobId)) {
        pendingJobs.delete(jobId);
        resolve({ success: false, error: "Print job timed out" });
      }
    }, 30000); // 30 second timeout

    // Send print job to agent
    agent.send(JSON.stringify({
      type: "print-job",
      jobId,
      data,
      printerName
    }));

    console.log(`[WS] Print job ${jobId} sent to agent ${agent.agentId}`);
  });
}

/**
 * Request test print from an agent
 * @param {string} printerName - Optional specific printer name
 */
function requestTestPrint(printerName = null) {
  const agent = Array.from(printAgents.values()).find(ws => 
    ws.isAuthenticated && ws.readyState === WebSocket.OPEN
  );

  if (!agent) {
    return { success: false, error: "No print agent connected" };
  }

  agent.send(JSON.stringify({
    type: "test-print",
    printerName
  }));

  return { success: true, message: "Test print request sent" };
}

/**
 * Request printer list from an agent
 */
function requestPrinterList() {
  const agent = Array.from(printAgents.values()).find(ws => 
    ws.isAuthenticated && ws.readyState === WebSocket.OPEN
  );

  if (!agent) {
    return { success: false, error: "No print agent connected" };
  }

  agent.send(JSON.stringify({ type: "list-printers" }));
  return { success: true, message: "Printer list request sent" };
}

/**
 * Get connected agents count
 */
function getConnectedAgentsCount() {
  return printAgents.size;
}

/**
 * Check if any print agent is available
 */
function isPrintAgentAvailable() {
  return Array.from(printAgents.values()).some(ws => 
    ws.isAuthenticated && ws.readyState === WebSocket.OPEN
  );
}

module.exports = {
  initWebSocket,
  sendPrintJob,
  requestTestPrint,
  requestPrinterList,
  getConnectedAgentsCount,
  isPrintAgentAvailable,
  broadcastQueueUpdate,
  broadcastAssistanceAlert,
};
