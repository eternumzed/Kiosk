const templates = require('../../../templates');
const renderCarbone = require('./renderCarbone');
const addImages = require('./addImages');
const fs = require('fs');
const path = require('path');

module.exports = async function generatePdf({ templateKey, rawData }) {
  const template = templates[templateKey];

  if (!template) {
    throw new Error(`Invalid template: ${templateKey}`);
  }

  // 1. Text rendering
  const basePdf = await renderCarbone(
    template.docx,
    template.dataMapper(rawData)
  );

  // 2. Images (optional) - embedded in PDF
  let finalPdf = basePdf;
  if (template.images && template.images.length > 0) {
    // Pass photoId base64 data if available
    finalPdf = await addImages(basePdf, template.images, rawData.photoId);

    // If addImages produced a new file, remove the intermediate base PDF to avoid tmp accumulation
    try {
      if (finalPdf && basePdf && path.resolve(finalPdf) !== path.resolve(basePdf)) {
        if (fs.existsSync(basePdf)) {
          fs.unlinkSync(basePdf);
        }
      }
    } catch (err) {
      console.warn('Failed to remove intermediate base PDF:', err.message || err);
    }
  }

  return finalPdf;
};
