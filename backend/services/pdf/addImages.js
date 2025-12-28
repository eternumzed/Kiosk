const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

module.exports = async function addImages(pdfPath, images, photoIdBase64 = null) {
  const pdfDoc = await PDFDocument.load(
    await fsp.readFile(pdfPath)
  );

  const page = pdfDoc.getPages()[0];

  for (const imgCfg of images) {
    let imgBytes;
    
    // Check if imgCfg.path is 'photoId' - use provided base64 data
    if (imgCfg.path === 'photoId' && photoIdBase64) {
      // Extract base64 data from data URL format (data:image/jpeg;base64,...)
      const base64Data = photoIdBase64.includes(',') 
        ? photoIdBase64.split(',')[1] 
        : photoIdBase64;
      imgBytes = Buffer.from(base64Data, 'base64');
    } else {
      // Traditional file path approach
      const imgPath = path.join(
        __dirname,
        '..',
        '..',
        '..',
        'templates',
        imgCfg.path
      );

      if (!fs.existsSync(imgPath)) {
        console.warn(`Image not found: ${imgPath}, skipping...`);
        continue;
      }

      imgBytes = await fsp.readFile(imgPath);
    }

    // Determine image format and embed accordingly
    let img;
    try {
      // Try JPEG first (most common for photos)
      img = await pdfDoc.embedJpg(imgBytes);
    } catch (jpgError) {
      try {
        // Fallback to PNG
        img = await pdfDoc.embedPng(imgBytes);
      } catch (pngError) {
        console.error(`Failed to embed image: ${imgCfg.path}`, pngError);
        continue;
      }
    }

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

