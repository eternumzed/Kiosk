const { spawn } = require('child_process');

exports.print = async (req, res) => {
  try {
    const lineWidth = 32;

    const wrapText = (text) => {
      if (!text) return [''];
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      words.forEach((word) => {
        if ((currentLine + ' ' + word).trim().length <= lineWidth) {
          currentLine = (currentLine + ' ' + word).trim();
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        }
      });
      if (currentLine) lines.push(currentLine);
      return lines;
    };

    const centerText = (text) => {
      const lines = wrapText(text);
      return lines.map((line) => {
        const spaces = Math.floor((lineWidth - line.length) / 2);
        return ' '.repeat(Math.max(0, spaces)) + line;
      }).join('\n');
    };

    const leftText = (label, value) => {
      const lines = wrapText(`${label}: ${value}`);
      return lines.join('\n');
    };

    const separator = '-'.repeat(lineWidth);

    const formatReceipt = ({ referenceNumber, fullName, document, amount, status, paymentStatus }) => {
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

    const printerName = 'KioskPrinterWired';

    const ps = spawn('powershell.exe', ['-Command', `Out-Printer -Name "${printerName}"`]);

    ps.stdin.write(receiptText);
    ps.stdin.end();

    ps.stdout.on('data', (data) => console.log('stdout:', data.toString()));
    ps.stderr.on('data', (data) => console.error('stderr:', data.toString()));

    ps.on('close', (code) => {
      if (code === 0) {
        return res.send('Receipt sent to printer');
      } else {
        return res.status(500).send(`Printing failed with code ${code}`);
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).send('Failed to print receipt');
  }
};
