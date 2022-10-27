const express = require('express');
const { storageEndpointRouter } = require('./storage-endpoint');
const { uploadRouter } = require('./upload');

const apiRouter = express.Router();

apiRouter.use('/uploads', uploadRouter);
apiRouter.use('/storage-endpoint', storageEndpointRouter);

module.exports = {
  apiRouter,
};
