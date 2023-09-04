const path = require('path');
const xbytes = require('xbytes');
const env = require('@blocklet/sdk/lib/env');

module.exports = {
  ...env,
  uploadDir: path.join(env.dataDir, 'uploads'),
  maxUploadSize: xbytes.parseSize(process.env.MAX_UPLOAD_SIZE, { iec: false }), // not use iec
  uploaderRoles: process.env.UPLOADER_ROLES?.split(',')
    .map((x) => x.trim())
    .filter(Boolean),
  providerOptions: {
    unsplash: {
      key: process.env.UNSPLASH_KEY,
      secret: process.env.UNSPLASH_SECRET,
    },
  },
};
