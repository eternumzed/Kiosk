const { writeFileSync, unlinkSync } = require("fs");
const { tmpdir } = require("os");
const { join } = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

async function listPrinters() {
  try {
    const ps = 'Get-Printer | Select-Object -Property Name,Default | ConvertTo-Json';
    const { stdout } = await execFileAsync("powershell.exe", ["-NoProfile", "-Command", ps], { windowsHide: true });
    const data = JSON.parse(stdout);
    const printers = Array.isArray(data) ? data : [data];
    return printers.map(p => ({ name: p.Name, isDefault: !!p.Default }));
  } catch (err) {
    console.error("Failed to list printers:", err.message || err);
    return [];
  }
}

async function choosePrinter() {
  const printers = await listPrinters();
  if (!printers.length) return null;
  const preferred = printers.find(p => /thermal/i.test(p.name)) || printers.find(p => p.isDefault) || printers[0];
  return preferred.name;
}

function buildPayload(data) {
  const ESC = "\x1B";
  const GS = "\x1D";
  const init = ESC + "@";
  const alignCenter = ESC + "a" + "\x01";
  const alignLeft = ESC + "a" + "\x00";
  const boldOn = ESC + "E" + "\x01";
  const boldOff = ESC + "E" + "\x00";
  const cut = GS + "V" + "\x00";

  const header = `${init}${alignCenter}${boldOn}Municipality of Dasmariñas, Cavite${boldOff}\n`;
  const body =
    `${alignLeft}------------------------------\n` +
    `Name: ${data.fullName}\n` +
    `Document: ${data.document}\n` +
    `Reference No: ${data.referenceNumber}\n` +
    `Amount: PHP${data.amount}\n` +
    `Status: ${data.status}\n` +
    `Payment: ${data.paymentStatus}\n` +
    `Date: ${new Date().toLocaleString()}\n\n` +
    `Thank you for using our kiosk!\n`;
  const footer = "\n\n\n" + cut;

  return Buffer.from(header + body + footer, "ascii");
}

async function sendToPrinter(printerName, buffer) {
  const base64 = buffer.toString("base64");
  const tempPath = join(tmpdir(), `send_raw_print_${Date.now()}.ps1`);

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
    DOCINFOA di = new DOCINFOA(); di.pDocName = "RawDocument"; di.pDataType = "RAW";
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
    ], { windowsHide: true, maxBuffer: 10 * 1024 * 1024 });

    return { ok: stdout.includes("OK"), stdout, stderr };
  } finally {
    try { unlinkSync(tempPath); } catch (_) {}
  }
}


exports.print = async(req, res) => {
  const printer = await choosePrinter();
  if (!printer) {
    return res.status(500).send("No printer found. Add a thermal printer in Windows 'Printers & Scanners'.");
  }

  const payload = buildPayload(req.body);

  try {
    const result = await sendToPrinter(printer, payload);
    if (result.ok) res.send("Receipt sent to printer");
    else res.status(500).send(`Printing failed: ${result.stderr || result.stdout}`);
  } catch (err) {
    res.status(500).send(`Error printing receipt: ${err.message || err}`);
  }
}
