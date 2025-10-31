const { exec } = require('child_process');

exports.print = async (req, res) => {
  const formatReceipt = ({ referenceNumber, fullName, document, amount, status, paymentStatus }) => {
    const lineWidth = 32;
    const centerText = (text) => {
      const spaces = Math.floor((lineWidth - text.length) / 2);
      return ' '.repeat(Math.max(0, spaces)) + text;
    };

    const separator = '-'.repeat(lineWidth);

    return `
${centerText('*** MUNICIPALITY RECEIPT ***')}
${separator}
Reference ID: ${referenceNumber}
Full Name   : ${fullName}
Document    : ${document}
Amount      : PHP${amount}
Status      : ${status}
Payment     : ${paymentStatus}
${separator}
${centerText('Thank you!')}
`;
  };

  const receiptText = formatReceipt(req.body);

  
  const escapedText = receiptText.replace(/"/g, '""').replace(/\n/g, '`n');

  
  const psCommand = `Add-Content -Path $env:TEMP\\receipt.ps1 -Value "${escapedText}" ; Start-Process powershell -ArgumentList '-Command Add-Content -Path $env:TEMP\\\\receipt.txt -Value "${escapedText}"; Start-Process -FilePath $env:TEMP\\\\receipt.txt -Verb Print'`;

  exec(`powershell.exe -Command "${psCommand}"`, (err, stdout, stderr) => {
    if (err) {
      console.error('Printing error:', err);
      return res.status(500).send('Failed to print receipt');
    }
    return res.send('Receipt sent to printer');
  });
};
