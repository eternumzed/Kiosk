const Request = require('../models/requestSchema');

const QUEUE_STATUSES = ['Processing', 'For Pick-up'];

function mapQueueItem(requestDoc) {
  return {
    _id: requestDoc._id,
    referenceNumber: requestDoc.referenceNumber,
    document: requestDoc.document || requestDoc.type || '-',
    fullName: requestDoc.fullName || '-',
    status: requestDoc.status,
    updatedAt: requestDoc.updatedAt,
    createdAt: requestDoc.createdAt,
  };
}

async function getQueueSnapshot() {
  const requests = await Request.find({
    deleted: { $ne: true },
    status: { $in: QUEUE_STATUSES },
  })
    .sort({ createdAt: 1, _id: 1 })
    .select('referenceNumber document type fullName status updatedAt createdAt');

  const nowServing = [];
  const forPickup = [];

  requests.forEach((item) => {
    const mapped = mapQueueItem(item);
    if (item.status === 'Processing') {
      nowServing.push(mapped);
    } else if (item.status === 'For Pick-up') {
      forPickup.push(mapped);
    }
  });

  return {
    nowServing,
    forPickup,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  getQueueSnapshot,
};
