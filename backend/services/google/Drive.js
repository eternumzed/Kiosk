const fs = require('fs');
const { Readable } = require('stream');
const { google } = require('googleapis');
const { oAuth2Client } = require('../../googleAuth');
const Request = require('../../models/requestSchema');

const FOLDER_ID = '1W91EpKXT1__yVhHH_WPv2fZMkK6_SkOZ';

const drive = google.drive({ version: 'v3', auth: oAuth2Client });

/**
 * Upload PDF to Google Drive and update request record with PDF metadata
 * @param {string} pdfPath - Local path to PDF file
 * @param {string} namePrefix - Reference number or prefix for filename
 * @param {object} meta - Metadata including { type, referenceNumber, requestId }
 */
exports.uploadPdf = async (pdfPath, namePrefix, meta) => {
  // If namePrefix looks like a reference number (contains dashes), use it verbatim
  // otherwise include a timestamp to avoid collisions
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const fileName = (typeof namePrefix === 'string' && namePrefix.includes('-'))
    ? `${namePrefix}.pdf`
    : `${namePrefix || 'Document'}_${timestamp}.pdf`;

  const resource = {
    name: fileName,
    parents: [FOLDER_ID],
  };

  const res = await drive.files.create({
    resource,
    media: {
      mimeType: 'application/pdf',
      body: fs.createReadStream(pdfPath),
    },
    fields: 'id, name, webViewLink, webContentLink, createdTime, size',
  });

  // Update request document with PDF metadata
  try {
    // Ensure type is not empty - it's critical for the type field
    const documentType = meta?.type || '';
    if (!documentType) {
      console.warn(`⚠️  WARNING: type is empty! meta.type=${meta?.type}`);
    }
    
    const updateData = {
      type: documentType,  // Make sure this is set
      fileId: res.data.id,
      pdfFileName: res.data.name,
      pdfUploadedAt: res.data.createdTime,
      pdfSize: res.data.size,
      pdfUrl: res.data.webViewLink,
      pdfDownloadUrl: res.data.webContentLink,
    };
    
    console.log(`[uploadPdf] Updating request with PDF metadata:`, { 
      type: documentType, 
      fileId: res.data.id, 
      referenceNumber: meta?.referenceNumber 
    });
    
    // Update by MongoDB _id first (most direct), then fallback to referenceNumber
    let updated;
    if (meta?.requestId) {
      console.log(`  [1] Using requestId: ${meta.requestId}`);
      updated = await Request.findByIdAndUpdate(meta.requestId, updateData, { new: true });
    } else if (meta?.referenceNumber) {
      console.log(`  [2] Using referenceNumber: ${meta.referenceNumber}`);
      updated = await Request.findOneAndUpdate(
        { referenceNumber: meta.referenceNumber },
        updateData,
        { new: true }
      );
    } else {
      console.warn('[uploadPdf] ❌ No requestId or referenceNumber provided for PDF metadata update');
    }
    
    if (updated) {
      console.log(`  [uploadPdf] ✅ Request updated. Type is now: "${updated.type}", FileId: ${updated.fileId}`);
    } else {
      console.warn(`  [uploadPdf] ❌ No request found to update. Params: requestId=${meta?.requestId}, referenceNumber=${meta?.referenceNumber}`);
    }
  } catch (err) {
    console.error('[uploadPdf] Failed to update request with PDF metadata:', err.message);
  }

  // Make file public on Google Drive
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return res.data;
};


exports.listPdfs = async () => {
  const res = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType='application/pdf'`,
    fields: 'files(id,name,createdTime,size,webViewLink,webContentLink)',
    orderBy: 'createdTime desc',
  });

  console.log(`Found ${res.data.files?.length || 0} PDFs in Google Drive`);


  const requestByFileId = {};
  const requestByRefNumber = {};
  const pdfsWithMetadata = [];
  
  try {
    const allRequests = await Request.find({ deleted: { $ne: true } });
    console.log(`Found ${allRequests.length} active requests in MongoDB`);
    
    allRequests.forEach(req => {
      if (req.fileId) {
        requestByFileId[req.fileId] = req;
      }
      if (req.referenceNumber) {
        requestByRefNumber[req.referenceNumber] = req;
      }
    });
  } catch (err) {
    console.error('Failed to fetch requests:', err.message);
  }

  // Merge Drive files with request data
  (res.data.files || []).forEach(file => {
    let request = requestByFileId[file.id];
    
    // Fallback: Try to match by reference number extracted from filename
    if (!request && file.name) {
      const match = file.name.match(/^([\w-]+)\.pdf$/i);
      if (match) {
        const refNumber = match[1];
        request = requestByRefNumber[refNumber];
        if (request) {
          console.log(`  (Matched by filename: ${file.name} -> ${refNumber})`);
        }
      }
    }
    
    const merged = {
      ...file,
      appProperties: {
        type: request?.type || '',
        status: request?.status || 'Pending',
        referenceNumber: request?.referenceNumber || '',
      }
    };
    
    if (request) {
      console.log(`Request found for ${file.id}: type=${request.type}, status=${request.status}`);
    } else {
      console.log(`No request found for fileId ${file.id}: ${file.name}`);
    }
    
    pdfsWithMetadata.push(merged);
  });

  return pdfsWithMetadata;
};

exports.downloadPdf = async (fileId) => {
  return drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
};

/**
 * Soft delete a PDF - mark request as deleted in MongoDB (keeps file on Drive for recovery)
 * @param {string} fileId - Google Drive file ID
 * @param {object} options - Optional { deletedBy, deletedReason }
 */
exports.deletePdf = async (fileId, options = {}) => {
  try {
    console.log(`Soft-deleting request for fileId ${fileId}`);
    const updated = await Request.findOneAndUpdate(
      { fileId },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedReason: options.deletedReason || 'Deleted via admin dashboard',
        deletedBy: options.deletedBy || 'admin'
      },
      { new: true }
    );
    
    if (updated) {
      console.log(`✅ Request soft-deleted successfully:`, updated._id);
    } else {
      console.warn(`❌ No request found with fileId: ${fileId}`);
    }
  } catch (err) {
    console.error('Failed to soft delete PDF:', err.message);
    throw err;
  }
};


exports.updateStatus = async (fileIdOrRef, status) => {
  try {
    console.log(`[updateStatus] Updating for: ${fileIdOrRef} to status: ${status}`);
    
    let updated;
    

    console.log(`  [1] Trying to find by fileId...`);
    updated = await Request.findOneAndUpdate(
      { fileId: fileIdOrRef },
      { status },
      { new: true }
    );
    
    if (updated) {
      console.log(`  ✅ Found by fileId: ${updated.referenceNumber}`);
      return updated;
    }
    

    console.log(`  [2] Trying to find by referenceNumber...`);
    updated = await Request.findOneAndUpdate(
      { referenceNumber: fileIdOrRef },
      { status },
      { new: true }
    );
    
    if (updated) {
      console.log(`  ✅ Found by referenceNumber: ${updated.referenceNumber}`);
      return updated;
    }
    

    console.log(`  [3] Searching by Drive API to find matching request...`);
    const file = await drive.files.get({
      fileId: fileIdOrRef,
      fields: 'name'
    }).catch(() => null);
    
    if (file?.data?.name) {
      const match = file.data.name.match(/^([\w-]+)\.pdf$/i);
      if (match) {
        const refNumber = match[1];
        console.log(`  [3] Extracted reference from filename: ${refNumber}`);
        updated = await Request.findOneAndUpdate(
          { referenceNumber: refNumber },
          { status },
          { new: true }
        );
        if (updated) {
          console.log(`  ✅ Found by filename reference: ${updated.referenceNumber}`);
          return updated;
        }
      }
    }
    
    // If we get here, document not found
    console.error(`❌ No request found for: ${fileIdOrRef}`);
    throw new Error(`No request record found for: ${fileIdOrRef}`);
    
  } catch (err) {
    console.error('[updateStatus] Error:', err.message);
    throw err;
  }
};

/**
 * Soft delete multiple PDFs - mark requests as deleted in MongoDB (keeps files on Drive for recovery)
 */
exports.deleteMultiple = async (fileIds, options = {}) => {
  try {
    console.log(`Soft-deleting ${fileIds.length} requests in MongoDB`);
    const result = await Request.updateMany(
      { fileId: { $in: fileIds } },
      {
        deleted: true,
        deletedAt: new Date(),
        deletedReason: options.deletedReason || 'Bulk deleted via admin dashboard',
        deletedBy: options.deletedBy || 'admin'
      }
    );
    
    console.log(`✅ ${result.modifiedCount} requests soft-deleted`);
    return { deleted: result.modifiedCount };
  } catch (err) {
    console.error('Failed to soft delete multiple PDFs:', err.message);
    throw err;
  }
};

/**
 * Upload photo to Google Drive and return the file ID
 * @param {Buffer} photoBuffer - Image file buffer
 * @param {string} referenceNumber - Reference number for naming
 * @param {string} mimeType - MIME type of the image (e.g., 'image/jpeg')
 */
exports.uploadPhoto = async (photoBuffer, referenceNumber, mimeType = 'image/jpeg') => {
  try {
    const fileName = `${referenceNumber}-photo.jpg`;
    
    // Convert Buffer to Readable stream
    const bufferStream = Readable.from(photoBuffer);
    
    const resource = {
      name: fileName,
      parents: [FOLDER_ID],
    };

    const res = await drive.files.create({
      resource,
      media: {
        mimeType: mimeType,
        body: bufferStream,
      },
      fields: 'id, name, webViewLink, webContentLink, createdTime, size',
    });

    // Make file public on Google Drive
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    console.log(`✅ Photo uploaded to Drive: ${fileName} (ID: ${res.data.id})`);

    return {
      photoFileId: res.data.id,
      photoFileName: res.data.name,
      photoUrl: res.data.webViewLink,
      photoDownloadUrl: res.data.webContentLink,
    };
  } catch (err) {
    console.error('Failed to upload photo to Google Drive:', err.message);
    throw err;
  }
};
