const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

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
      return lines.map(line => {
        const spaces = Math.floor((lineWidth - line.length) / 2);
        return ' '.repeat(Math.max(0, spaces)) + line;
      }).join('\n');
    };

    // Left-align text
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

    const filePath = path.join(process.env.TEMP, 'receipt.txt');
    fs.writeFileSync(filePath, receiptText, 'utf8');

    const printerName = 'KioskPrinterWired';

    const printCommand = `print /D:"${printerName}" "${filePath}"`;

    exec(printCommand, (err, stdout, stderr) => {
      console.log('=== stdout ===\n', stdout);
      console.log('=== stderr ===\n', stderr);

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
