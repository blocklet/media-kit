const path = require('path');
const xbytes = require('xbytes');
const env = require('@blocklet/sdk/lib/env');
const config = require('@blocklet/sdk/lib/config');

const currentComponentInfo = config.components.find((x) => x.did === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9');

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
  currentComponentInfo,
};
