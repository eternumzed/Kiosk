const templates = require('../../../templates');
const renderCarbone = require('./renderCarbone');
const addImages = require('./addImages');

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
  }

  return finalPdf;
};
