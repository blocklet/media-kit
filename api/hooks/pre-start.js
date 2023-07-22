require('@blocklet/sdk/lib/error-handler');
require('dotenv-flow').config();

const xbytes = require('xbytes');
const { join } = require('path');
const { spawnSync } = require('child_process');

const logger = require('../libs/logger');
const { name } = require('../../package.json');
const { maxUploadSize } = require('../libs/env');

function verifyMaxUploadSize() {
  if (!xbytes.isBytes(maxUploadSize)) {
    throw new Error(`MAX_UPLOAD_SIZE ${maxUploadSize} is not a valid byte string, examples(1MB, 200kb)`);
  }
}

function ensureSharpInstalled() {
  logger.info(`${name} ensure sharp installed`);
  try {
    // eslint-disable-next-line global-require
    require('sharp');
    logger.info(`${name} sharp already installed`);
    return;
  } catch {
    // Do nothing
  }
  logger.info(`${name} try install sharp`);
  spawnSync('npm', ['run', 'install'], {
    cwd: join(process.env.BLOCKLET_APP_DIR, 'node_modules/sharp'),
    stdio: 'inherit',
    shell: true,
  });
}

(() => {
  try {
    verifyMaxUploadSize();
    ensureSharpInstalled();
    process.exit(0);
  } catch (err) {
    logger.error(`${name} pre-start error`, err.message);
    process.exit(1);
  }
})();
