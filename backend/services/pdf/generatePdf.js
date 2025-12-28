const templates = require('../../../templates');
const renderCarbone = require('./renderCarbone');
const addImages = require('./addImages');
const uploadDrive = require('./uploadDrive');
const { uploadPhoto } = require('../google/Drive');

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

  // 2. Images (optional)
  let finalPdf = basePdf;
  if (template.images && template.images.length > 0) {
    // Pass photoId base64 data if available
    finalPdf = await addImages(basePdf, template.images, rawData.photoId);
  }

  // 3. Upload photo to Google Drive if it exists and reference number is available
  let photoMetadata = null;
  if (rawData.photoId && rawData.referenceNumber) {
    try {
      const base64Data = rawData.photoId.includes(',')
        ? rawData.photoId.split(',')[1]
        : rawData.photoId;
      const photoBuffer = Buffer.from(base64Data, 'base64');
      
      photoMetadata = await uploadPhoto(photoBuffer, rawData.referenceNumber, 'image/jpeg');
      console.log(`Photo uploaded to Drive for ${rawData.referenceNumber}:`, photoMetadata);
    } catch (err) {
      console.error(`Failed to upload photo for ${rawData.referenceNumber}:`, err.message);
      // Don't fail the entire PDF generation if photo upload fails
    }
  }

  // Return both PDF path and photo metadata
  return { 
    pdfPath: finalPdf,
    photoMetadata 
  };
};
