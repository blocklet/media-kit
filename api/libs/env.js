const path = require('path');
const env = require('@blocklet/sdk/lib/env');

module.exports = {
  ...env,
  uploadDir: path.join(env.dataDir, 'uploads'),
  maxUploadSize: process.env.MAX_UPLOAD_SIZE,
};
