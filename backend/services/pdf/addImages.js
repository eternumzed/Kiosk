const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

module.exports = async function addImages(pdfPath, images) {
  const pdfDoc = await PDFDocument.load(
    await fsp.readFile(pdfPath)
  );

  const page = pdfDoc.getPages()[0];

  for (const imgCfg of images) {
    const imgPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      'templates',
      imgCfg.path
    );

    if (!fs.existsSync(imgPath)) {
      throw new Error(`Image not found: ${imgPath}`);
    }

    const imgBytes = await fsp.readFile(imgPath);
    const img = await pdfDoc.embedJpg(imgBytes);

    page.drawImage(img, {
      x: imgCfg.x,
      y: imgCfg.y,
      width: imgCfg.width,
      height: imgCfg.height,
    });
  }

  const outputPath = pdfPath.replace('.pdf', '-final.pdf');
  await fsp.writeFile(outputPath, await pdfDoc.save());

  return outputPath;
};
