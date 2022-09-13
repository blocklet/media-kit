require('@blocklet/sdk/lib/error-handler');
require('dotenv-flow').config();

const xbytes = require('xbytes');

const logger = require('../libs/logger');
const { name } = require('../../package.json');
const { maxUploadSize } = require('../libs/env');

async function verifyMaxUploadSize() {
  if (!xbytes.isBytes(maxUploadSize)) {
    throw new Error(`MAX_UPLOAD_SIZE ${maxUploadSize} is not a valid byte string, examples(1MB, 200kb)`);
  }
}

(async () => {
  try {
    await verifyMaxUploadSize();
    process.exit(0);
  } catch (err) {
    logger.error(`${name} pre-start error`, err.message);
    process.exit(1);
  }
})();
