# print-receipt.ps1
# Windows Print Agent Script - receives base64 ESC/POS data and prints to thermal printer
# Usage: .\print-receipt.ps1 -base64 "BASE64_ENCODED_DATA" [-printerName "Printer Name"]

param(
    [Parameter(Mandatory=$true)]
    [string]$base64,
    
    [Parameter(Mandatory=$false)]
    [string]$printerName
)

# Convert base64 to bytes
try {
    $bytes = [System.Convert]::FromBase64String($base64)
} catch {
    Write-Error "Invalid base64 data: $_"
    exit 1
}

# Auto-select printer if not specified
if (-not $printerName) {
    $printers = Get-Printer | Select-Object -Property Name, Default
    
    # Prefer thermal printer, then default, then first available
    $thermal = $printers | Where-Object { $_.Name -match 'thermal' } | Select-Object -First 1
    $default = $printers | Where-Object { $_.Default -eq $true } | Select-Object -First 1
    $first = $printers | Select-Object -First 1
    
    if ($thermal) {
        $printerName = $thermal.Name
    } elseif ($default) {
        $printerName = $default.Name
    } elseif ($first) {
        $printerName = $first.Name
    } else {
        Write-Error "No printer found"
        exit 2
    }
}

Write-Host "Printing to: $printerName"

# Raw printer interop
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi)]
    public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv")]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA")]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);

    [DllImport("winspool.Drv")]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv")]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv")]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv")]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] pBytes) {
        IntPtr hPrinter;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = "KioskReceipt";
        di.pDataType = "RAW";

        if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            return false;
        }

        if (!StartDocPrinter(hPrinter, 1, di)) {
            ClosePrinter(hPrinter);
            return false;
        }

        if (!StartPagePrinter(hPrinter)) {
            EndDocPrinter(hPrinter);
            ClosePrinter(hPrinter);
            return false;
        }

        IntPtr pUnmanagedBytes = Marshal.AllocHGlobal(pBytes.Length);
        Marshal.Copy(pBytes, 0, pUnmanagedBytes, pBytes.Length);

        int dwWritten = 0;
        bool success = WritePrinter(hPrinter, pUnmanagedBytes, pBytes.Length, out dwWritten);

        Marshal.FreeHGlobal(pUnmanagedBytes);
        EndPagePrinter(hPrinter);
        EndDocPrinter(hPrinter);
        ClosePrinter(hPrinter);

        return success;
    }
}
"@ -PassThru | Out-Null

# Send to printer
try {
    $success = [RawPrinterHelper]::SendBytesToPrinter($printerName, $bytes)
    if ($success) {
        Write-Output "OK"
        exit 0
    } else {
        Write-Error "Failed to send data to printer"
        exit 3
    }
} catch {
    Write-Error "Print error: $_"
    exit 4
}
