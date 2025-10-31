const { exec } = require('child_process');

exports.print = async (req, res) => {
  try {
    const formatReceipt = ({ referenceNumber, fullName, document, amount, status, paymentStatus }) => {
      const lineWidth = 32;

      const centerText = (text) => {
        if (!text) text = '';
        const cleanText = text.replace(/\r?\n/g, '');
        const truncated = cleanText.length > lineWidth ? cleanText.slice(0, lineWidth) : cleanText;
        const spaces = Math.floor((lineWidth - truncated.length) / 2);
        return ' '.repeat(Math.max(0, spaces)) + truncated;
      };

      const leftText = (label, value) => {
        const safeLabel = label || '';
        const safeValue = value || '';
        const line = `${safeLabel}: ${safeValue}`;
        return line.length > lineWidth ? line.slice(0, lineWidth) : line;
      };

      const separator = '-'.repeat(lineWidth);

      return `
${centerText('*** MUNICIPALITY RECEIPT ***')}
${separator}
${leftText('Reference ID', referenceNumber)}
${leftText('Full Name', fullName)}
${leftText('Document', document)}
${leftText('Amount', `PHP${amount}`)}
${leftText('Status', status)}
${leftText('Payment', paymentStatus)}
${separator}
${centerText('Thank you!')}
`;
    };

    const receiptText = formatReceipt(req.body);

    const psText = receiptText.replace(/"/g, '`"').replace(/\n/g, '`n');

    const printerName = 'KioskPrinterWired';
    const psCommand = `powershell.exe -Command "$text = \\"${psText}\\"; $text | Out-Printer -Name \\"${printerName}\\""`;


    exec(psCommand, (err, stdout, stderr) => {
      console.log('=== PowerShell stdout ===\n', stdout);
      console.log('=== PowerShell stderr ===\n', stderr);

      if (err) {
        console.error('Printing error:', err);
        return res.status(500).send('Failed to print receipt');
      }

      return res.send('Receipt sent to printer');
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send('Failed to print receipt');
  }
};
