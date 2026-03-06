const asyncHandler = require('express-async-handler');
const queueService = require('../services/queueService');

exports.getQueueSnapshot = asyncHandler(async (req, res) => {
  const snapshot = await queueService.getQueueSnapshot();
  res.json(snapshot);
});
