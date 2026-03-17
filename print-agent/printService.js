/**
 * Print Service for XP-58 Thermal Printer
 * 
 * Handles ESC/POS command generation and raw printing via Windows API
 */

const { writeFileSync, unlinkSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

/**
 * List all available printers on the Windows system
 */
async function listPrinters() {
    try {
        const ps = 'Get-Printer | Select-Object -Property Name,Default,DriverName,PortName | ConvertTo-Json';
        const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", ps], {
            windowsHide: true,
            timeout: 10000
        });
        const data = JSON.parse(stdout);
        const printers = Array.isArray(data) ? data : [data];
        console.log("[PRINT] Available printers:");
        printers.forEach((p, i) => {
            console.log(`   ${i + 1}. "${p.Name}" (Driver: ${p.DriverName}, Port: ${p.PortName})${p.Default ? ' [DEFAULT]' : ''}`);
        });
        return printers.map(p => ({ name: p.Name, isDefault: !!p.Default, driver: p.DriverName, port: p.PortName }));
    } catch (err) {
        console.error("Failed to list printers:", err.message || err);
        return [];
    }
}

/**
 * Choose the best printer (prefer thermal/XP-58, then default)
 */
async function choosePrinter(preferredName = null) {
    const printers = await listPrinters();
    if (!printers.length) {
        console.log("[PRINT] No printers found!");
        return null;
    }

    // If a specific printer is requested, try to find it (partial match)
    if (preferredName) {
        const found = printers.find(p =>
            p.name.toLowerCase().includes(preferredName.toLowerCase())
        );
        if (found) {
            console.log(`[PRINT] Using requested printer: "${found.name}"`);
            return found.name;
        }
    }

    // Priority: Kiosk-Printer > XP-58 > xprinter > thermal > POS > receipt > default > first
    const patterns = [/kiosk/i, /xp.?58/i, /xprinter/i, /thermal/i, /pos/i, /receipt/i];

    for (const pattern of patterns) {
        const match = printers.find(p => pattern.test(p.name) || pattern.test(p.driver));
        if (match) {
            console.log(`[PRINT] Auto-selected printer: "${match.name}" (matched: ${pattern})`);
            return match.name;
        }
    }

    // Fall back to default or first printer
    const defaultPrinter = printers.find(p => p.isDefault);
    if (defaultPrinter) {
        console.log(`[PRINT] Using default printer: "${defaultPrinter.name}"`);
        return defaultPrinter.name;
    }

    console.log(`[PRINT] Using first available printer: "${printers[0].name}"`);
    return printers[0].name;
}

function parseTimestamp(value) {
    if (!value) return null;

    const timestamp = value instanceof Date ? value : new Date(value);
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function formatReceiptTimestamp(value) {
    const timestamp = parseTimestamp(value) || new Date();

    return {
        dateStr: timestamp.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            timeZone: "Asia/Manila"
        }),
        timeStr: timestamp.toLocaleTimeString("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Manila"
        })
    };
}

function buildReceiptDateLine(data = {}) {
    const { dateStr, timeStr } = formatReceiptTimestamp(data.paidAt || data.date);
    return `Date: ${dateStr}  Time: ${timeStr}`;
}

/**
 * Build ESC/POS receipt payload
 */
function buildReceiptPayload(data) {
    // ESC/POS Command Constants
    const ESC = "\x1B";
    const GS = "\x1D";
    const LF = "\x0A";

    // Printer initialization
    const init = ESC + "\x40";  // ESC @

    // Text alignment (using hex codes for better compatibility)
    const alignCenter = ESC + "\x61\x01";  // ESC a 1
    const alignLeft = ESC + "\x61\x00";    // ESC a 0
    const alignRight = ESC + "\x61\x02";   // ESC a 2

    // Text emphasis
    const boldOn = ESC + "\x45\x01";       // ESC E 1
    const boldOff = ESC + "\x45\x00";      // ESC E 0
    const underlineOn = ESC + "\x2D\x01";  // ESC - 1
    const underlineOff = ESC + "\x2D\x00"; // ESC - 0

    // Text size (GS ! n) - combines width and height multipliers
    const textNormal = GS + "\x21\x00";
    const textDoubleWidth = GS + "\x21\x10";
    const textDoubleHeight = GS + "\x21\x01";
    const textDouble = GS + "\x21\x11";

    // Reverse print (white on black)
    const reverseOn = GS + "\x42\x01";   // GS B 1
    const reverseOff = GS + "\x42\x00";  // GS B 0

    // Line spacing
    const lineSpacingDefault = ESC + "\x32";      // ESC 2
    const lineSpacingTight = ESC + "\x33\x12";    // ESC 3 n

    // Paper cut - using simple format for XP-58 compatibility
    const feedAndCut = GS + "\x56\x00";           // GS V 0 (full cut)

    // Helper functions
    const RECEIPT_WIDTH = 32; // Standard 58mm thermal = ~32 chars

    const centerText = (text, width = RECEIPT_WIDTH) => {
        const padding = Math.max(0, Math.floor((width - text.length) / 2));
        return " ".repeat(padding) + text;
    };

    const labeledRow = (label, value, width = RECEIPT_WIDTH) => {
        const maxValueLen = width - label.length - 1;
        const trimmedValue = String(value).substring(0, maxValueLen);
        const spaces = width - label.length - trimmedValue.length;
        return label + " ".repeat(Math.max(1, spaces)) + trimmedValue;
    };

    // Decorative elements
    const doubleLine = "=".repeat(RECEIPT_WIDTH);
    const singleLine = "-".repeat(RECEIPT_WIDTH);
    const dotLine = ". ".repeat(RECEIPT_WIDTH / 2);

    // Format amount
    const formatAmount = (amount) => {
        const num = parseFloat(amount) || 0;
        return `PHP ${num.toFixed(2)}`;
    };

    const sanitizeReferenceNumber = (value) => String(value || '').trim();

    const buildQrCommands = (text) => {
        const qrPayload = Buffer.from(String(text || ''), 'utf8');
        const storeLength = qrPayload.length + 3;
        const pL = storeLength % 256;
        const pH = Math.floor(storeLength / 256);

        return Buffer.concat([
            Buffer.from([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]),
            Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]),
            Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31]),
            Buffer.from([0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30]),
            qrPayload,
            Buffer.from([0x0a]),
            Buffer.from([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),
            Buffer.from([0x0a]),
        ]);
    };

    const trackingBaseUrl = process.env.TRACKING_URL_BASE || 'https://kiosk.brgybiluso.me/request-status';
    const safeReferenceNumber = sanitizeReferenceNumber(data.referenceNumber);
    const qrTrackingUrl = `${trackingBaseUrl}?referenceNumber=${encodeURIComponent(safeReferenceNumber)}`;

    // Build receipt
    let receipt = "";

    // === HEADER ===
    receipt += init;
    receipt += alignCenter;
    receipt += boldOn + "SCAN TO TRACK STATUS" + boldOff + LF;
    receipt += "__QR_BLOCK__";
    receipt += LF;
    receipt += `Ref: ${safeReferenceNumber || 'N/A'}` + LF;
    receipt += singleLine + LF;
    receipt += LF;
    receipt += textDouble + boldOn;
    receipt += "BARANGAY BILUSO" + LF;
    receipt += textNormal + boldOff;
    receipt += textDoubleWidth;
    receipt += "Silang, Cavite" + LF;
    receipt += textNormal;
    receipt += LF;
    receipt += boldOn + "KIOSK TRANSACTION RECEIPT" + boldOff + LF;
    receipt += doubleLine + LF;

    // === REFERENCE NUMBER ===
    receipt += LF;
    receipt += reverseOn + textDoubleHeight + boldOn;
    receipt += ` ${safeReferenceNumber || "N/A"} ` + LF;
    receipt += reverseOff + textNormal + boldOff;
    receipt += LF;

    // === TRANSACTION DETAILS ===
    receipt += alignLeft;
    receipt += boldOn + underlineOn + "TRANSACTION DETAILS" + underlineOff + boldOff + LF;
    receipt += LF;
    receipt += labeledRow("Document:", data.document || "N/A") + LF;
    receipt += labeledRow("Status:", (data.status || "N/A").toUpperCase()) + LF;
    receipt += LF;
    receipt += singleLine + LF;

    // === CUSTOMER INFO ===
    receipt += LF;
    receipt += boldOn + underlineOn + "CUSTOMER INFORMATION" + underlineOff + boldOff + LF;
    receipt += LF;
    receipt += labeledRow("Name:", data.fullName || "N/A") + LF;
    if (data.email) {
        receipt += labeledRow("Email:", data.email) + LF;
    }
    if (data.phone) {
        receipt += labeledRow("Phone:", data.phone) + LF;
    }
    receipt += LF;
    receipt += singleLine + LF;

    // === PAYMENT ===
    receipt += LF;
    receipt += boldOn + underlineOn + "PAYMENT INFORMATION" + underlineOff + boldOff + LF;
    receipt += LF;
    receipt += alignRight;
    receipt += textDoubleHeight + boldOn;
    receipt += formatAmount(data.amount) + LF;
    receipt += textNormal + boldOff;
    receipt += alignLeft;
    receipt += LF;
    receipt += labeledRow("Payment Status:", (data.paymentStatus || "N/A").toUpperCase()) + LF;
    receipt += labeledRow("Payment Method:", data.paymentMethod || "Kiosk") + LF;
    receipt += LF;
    receipt += doubleLine + LF;

    // === DATE & TIME ===
    receipt += LF;
    receipt += alignCenter;
    receipt += buildReceiptDateLine(data) + LF;

    // === FOOTER ===
    receipt += LF;
    receipt += singleLine + LF;
    receipt += LF;
    receipt += boldOn + "Thank you for using our kiosk!" + boldOff + LF;
    receipt += LF;
    receipt += textNormal;
    receipt += "For inquiries, visit the" + LF;
    receipt += "Barangay Hall" + LF;
    receipt += "TEL: (046) 414-0204" + LF;
    receipt += "MOBILE: 0998-598-5622" + LF;
    receipt += "EMAIL: brgybiluso@gmail.com" + LF;
    receipt += dotLine + LF;
    receipt += LF;
    receipt += underlineOn + "Customer Copy" + underlineOff + LF;
    receipt += LF + LF + LF;

    // Cut paper
    receipt += feedAndCut;

    const marker = "__QR_BLOCK__";
    const markerBuffer = Buffer.from(marker, "ascii");
    const receiptBuffer = Buffer.from(receipt, "ascii");
    const markerIndex = receiptBuffer.indexOf(markerBuffer);

    if (markerIndex === -1) {
        return receiptBuffer;
    }

    return Buffer.concat([
        receiptBuffer.subarray(0, markerIndex),
        buildQrCommands(qrTrackingUrl),
        receiptBuffer.subarray(markerIndex + markerBuffer.length),
    ]);
}

/**
 * Build test print payload
 */
function buildTestPayload() {
    const ESC = "\x1B";
    const GS = "\x1D";
    const LF = "\x0A";

    const init = ESC + "\x40";           // ESC @
    const alignCenter = ESC + "\x61\x01"; // ESC a 1
    const boldOn = ESC + "\x45\x01";      // ESC E 1
    const boldOff = ESC + "\x45\x00";     // ESC E 0
    const feedAndCut = GS + "\x56\x00";   // GS V 0 (full cut)

    let test = "";
    test += init;
    test += alignCenter;
    test += LF;
    test += boldOn + "=== PRINT TEST ===" + boldOff + LF;
    test += LF;
    test += "Barangay Biluso Print Agent" + LF;
    test += LF;
    test += "If you can read this," + LF;
    test += "the printer is working!" + LF;
    test += LF;
    test += `Test time: ${new Date().toLocaleString()}` + LF;
    test += LF;
    test += "================================" + LF;
    test += LF + LF;
    test += feedAndCut;

    return Buffer.from(test, "ascii");
}

/**
 * Send raw bytes to printer using Windows API
 */
async function sendToPrinter(printerName, buffer) {
    console.log(`[PRINT] Sending ${buffer.length} bytes to printer: ${printerName}`);

    const base64 = buffer.toString("base64");
    const tempPath = join(tmpdir(), `print_job_${Date.now()}.ps1`);

    console.log(`[PRINT] Temp script: ${tempPath}`);

    const psScript = `
param([string]$printerName, [string]$base64)

Write-Output "Printer: $printerName"

$bytes = [System.Convert]::FromBase64String($base64)
Write-Output "Data size: $($bytes.Length) bytes"

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.ComponentModel;
public class RawPrinter {
  [StructLayout(LayoutKind.Sequential)] public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }
  [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.Drv", SetLastError=true)] public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true)] public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);
  [DllImport("winspool.Drv", SetLastError=true)] public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", SetLastError=true)] public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", SetLastError=true)] public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", SetLastError=true)] public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  
  public static string SendBytesToPrinter(string szPrinterName, byte[] pBytes) {
    IntPtr hPrinter = IntPtr.Zero;
    DOCINFOA di = new DOCINFOA(); 
    di.pDocName = "KioskReceipt"; 
    di.pDataType = "RAW";
    
    if(!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
      int err = Marshal.GetLastWin32Error();
      return "OpenPrinter failed: " + new Win32Exception(err).Message + " (Error " + err + ")";
    }
    
    if(!StartDocPrinter(hPrinter, 1, di)) { 
      int err = Marshal.GetLastWin32Error();
      ClosePrinter(hPrinter); 
      return "StartDocPrinter failed: " + new Win32Exception(err).Message;
    }
    
    if(!StartPagePrinter(hPrinter)) { 
      int err = Marshal.GetLastWin32Error();
      EndDocPrinter(hPrinter); 
      ClosePrinter(hPrinter); 
      return "StartPagePrinter failed: " + new Win32Exception(err).Message;
    }
    
    IntPtr unmanaged = Marshal.AllocHGlobal(pBytes.Length);
    Marshal.Copy(pBytes, 0, unmanaged, pBytes.Length);
    int written = 0;
    bool success = WritePrinter(hPrinter, unmanaged, pBytes.Length, out written);
    int writeErr = Marshal.GetLastWin32Error();
    Marshal.FreeHGlobal(unmanaged);
    EndPagePrinter(hPrinter);
    EndDocPrinter(hPrinter);
    ClosePrinter(hPrinter);
    
    if (!success) {
      return "WritePrinter failed: " + new Win32Exception(writeErr).Message;
    }
    return "OK:" + written;
  }
}
"@ -PassThru

try {
  $result = [RawPrinter]::SendBytesToPrinter($printerName, $bytes)
  if ($result.StartsWith("OK")) { 
    Write-Output $result
  } else { 
    Write-Error $result
    exit 2 
  }
} catch {
  Write-Error $_.Exception.Message
  exit 2
}
`;

    writeFileSync(tempPath, psScript, { encoding: "utf8" });

    try {
        const { stdout, stderr } = await execFileAsync("powershell.exe", [
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            tempPath,
            printerName,
            base64
        ], {
            windowsHide: true,
            maxBuffer: 10 * 1024 * 1024,
            timeout: 30000
        });

        console.log(`[PRINT] PowerShell stdout: "${stdout.trim()}"`);
        if (stderr) console.log(`[PRINT] PowerShell stderr: "${stderr}"`);
        console.log(`[PRINT] Result: ${stdout.includes("OK") ? "SUCCESS" : "FAILED"}`);

        return { success: stdout.includes("OK"), stdout, stderr };
    } finally {
        try { unlinkSync(tempPath); } catch (_) { }
    }
}

/**
 * Print a receipt
 */
async function printReceipt(data, preferredPrinter = null) {
    console.log(`[PRINT] === Starting print job ===`);
    console.log(`[PRINT] Data received:`, JSON.stringify(data, null, 2));

    try {
        const printerName = await choosePrinter(preferredPrinter);
        console.log(`[PRINT] Selected printer: ${printerName}`);

        if (!printerName) {
            console.log(`[PRINT] ERROR: No printer found!`);
            return { success: false, error: "No printer found" };
        }

        const payload = buildReceiptPayload(data);
        console.log(`[PRINT] Payload size: ${payload.length} bytes`);

        const result = await sendToPrinter(printerName, payload);
        console.log(`[PRINT] Print result:`, result.success ? "SUCCESS" : "FAILED");

        return {
            success: result.success,
            printerName,
            error: result.success ? null : (result.stderr || "Print failed")
        };
    } catch (err) {
        console.log(`[PRINT] ERROR: ${err.message}`);
        return { success: false, error: err.message };
    }
}

/**
 * Test print
 */
async function testPrint(preferredPrinter = null) {
    try {
        const printerName = await choosePrinter(preferredPrinter);
        if (!printerName) {
            return { success: false, error: "No printer found" };
        }

        const payload = buildTestPayload();
        const result = await sendToPrinter(printerName, payload);

        return {
            success: result.success,
            printerName,
            error: result.success ? null : (result.stderr || "Test print failed")
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = {
    listPrinters,
    choosePrinter,
    printReceipt,
    testPrint,
    formatReceiptTimestamp,
    buildReceiptDateLine,
    buildReceiptPayload,
    sendToPrinter
};
