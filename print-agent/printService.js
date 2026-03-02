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
    const ps = 'Get-Printer | Select-Object -Property Name,Default | ConvertTo-Json';
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", ps], { 
      windowsHide: true,
      timeout: 10000 
    });
    const data = JSON.parse(stdout);
    const printers = Array.isArray(data) ? data : [data];
    return printers.map(p => ({ name: p.Name, isDefault: !!p.Default }));
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
  if (!printers.length) return null;
  
  // If a specific printer is requested, try to find it
  if (preferredName) {
    const found = printers.find(p => p.name.toLowerCase() === preferredName.toLowerCase());
    if (found) return found.name;
  }
  
  // Priority: XP-58 > thermal > POS > default > first
  const preferred = 
    printers.find(p => /xp-?58/i.test(p.name)) ||
    printers.find(p => /thermal/i.test(p.name)) ||
    printers.find(p => /pos|receipt/i.test(p.name)) ||
    printers.find(p => p.isDefault) ||
    printers[0];
    
  return preferred.name;
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
  const init = ESC + "@";

  // Text alignment
  const alignCenter = ESC + "a\x01";
  const alignLeft = ESC + "a\x00";
  const alignRight = ESC + "a\x02";

  // Text emphasis
  const boldOn = ESC + "E\x01";
  const boldOff = ESC + "E\x00";
  const underlineOn = ESC + "-\x01";
  const underlineOff = ESC + "-\x00";

  // Text size (GS ! n) - combines width and height multipliers
  const textNormal = GS + "!\x00";
  const textDoubleWidth = GS + "!\x10";
  const textDoubleHeight = GS + "!\x01";
  const textDouble = GS + "!\x11";

  // Reverse print (white on black)
  const reverseOn = GS + "B\x01";
  const reverseOff = GS + "B\x00";

  // Line spacing
  const lineSpacingDefault = ESC + "2";
  const lineSpacingTight = ESC + "3\x12";

  // Paper cut
  const feedAndCut = GS + "V\x41\x03";

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

  // Build receipt
  let receipt = "";

  // === HEADER ===
  receipt += init;
  receipt += lineSpacingDefault;
  receipt += alignCenter;
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
  receipt += ` ${data.referenceNumber || "N/A"} ` + LF;
  receipt += reverseOff + textNormal + boldOff;
  receipt += LF;

  // === TRANSACTION DETAILS ===
  receipt += alignLeft;
  receipt += boldOn + underlineOn + "TRANSACTION DETAILS" + underlineOff + boldOff + LF;
  receipt += lineSpacingTight;
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
  receipt += lineSpacingDefault;
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
  const now = new Date();
  const dateStr = data.date || now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
  const timeStr = now.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  receipt += alignCenter;
  receipt += `Date: ${dateStr}  Time: ${timeStr}` + LF;

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
  receipt += "EMAIL: brgybiluso@gmail.com";
  receipt += LF;
  receipt += dotLine + LF;
  receipt += LF;
  receipt += underlineOn + "Customer Copy" + underlineOff + LF;
  receipt += LF + LF + LF;

  // Cut paper
  receipt += feedAndCut;

  return Buffer.from(receipt, "ascii");
}

/**
 * Build test print payload
 */
function buildTestPayload() {
  const ESC = "\x1B";
  const GS = "\x1D";
  const LF = "\x0A";
  
  const init = ESC + "@";
  const alignCenter = ESC + "a\x01";
  const boldOn = ESC + "E\x01";
  const boldOff = ESC + "E\x00";
  const feedAndCut = GS + "V\x41\x03";
  
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
  const base64 = buffer.toString("base64");
  const tempPath = join(tmpdir(), `print_job_${Date.now()}.ps1`);

  const psScript = `
param([string]$printerName, [string]$base64)

$bytes = [System.Convert]::FromBase64String($base64)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinter {
  [StructLayout(LayoutKind.Sequential)] public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }
  [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.Drv")] public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA")] public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);
  [DllImport("winspool.Drv")] public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv")] public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv")] public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.Drv")] public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  public static bool SendBytesToPrinter(string szPrinterName, byte[] pBytes) {
    IntPtr hPrinter;
    DOCINFOA di = new DOCINFOA(); di.pDocName = "KioskReceipt"; di.pDataType = "RAW";
    if(!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) return false;
    if(!StartDocPrinter(hPrinter, 1, di)) { ClosePrinter(hPrinter); return false; }
    if(!StartPagePrinter(hPrinter)) { EndDocPrinter(hPrinter); ClosePrinter(hPrinter); return false; }
    IntPtr unmanaged = Marshal.AllocHGlobal(pBytes.Length);
    Marshal.Copy(pBytes, 0, unmanaged, pBytes.Length);
    int written = 0;
    bool success = WritePrinter(hPrinter, unmanaged, pBytes.Length, out written);
    Marshal.FreeHGlobal(unmanaged);
    EndPagePrinter(hPrinter);
    EndDocPrinter(hPrinter);
    ClosePrinter(hPrinter);
    return success;
  }
}
"@ -PassThru

try {
  $ok = [RawPrinter]::SendBytesToPrinter($printerName, $bytes)
  if ($ok) { Write-Output "OK" } else { Write-Error "FAILED"; exit 2 }
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

    return { success: stdout.includes("OK"), stdout, stderr };
  } finally {
    try { unlinkSync(tempPath); } catch (_) { }
  }
}

/**
 * Print a receipt
 */
async function printReceipt(data, preferredPrinter = null) {
  try {
    const printerName = await choosePrinter(preferredPrinter);
    if (!printerName) {
      return { success: false, error: "No printer found" };
    }

    const payload = buildReceiptPayload(data);
    const result = await sendToPrinter(printerName, payload);

    return {
      success: result.success,
      printerName,
      error: result.success ? null : (result.stderr || "Print failed")
    };
  } catch (err) {
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
  buildReceiptPayload,
  sendToPrinter
};
