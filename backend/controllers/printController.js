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

   const psText = receiptText.replace(/"/g, '`"').replace(/\n/g, '`n');

  const psCommand = `powershell.exe -Command "$text = \\"${psText}\\"; $text | Out-Printer`;

  exec(psCommand, (err, stdout, stderr) => {
    console.log('=== PowerShell stdout ===');
    console.log(stdout);       
    console.log('=== PowerShell stderr ===');
    console.log(stderr);       

    if (err) {
      console.error('Printing error:', err);
      return res.status(500).send('Failed to print receipt');
    }
    return res.send('Receipt sent to printer');
  });
};
