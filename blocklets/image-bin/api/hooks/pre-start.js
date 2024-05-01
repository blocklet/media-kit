require('@blocklet/sdk/lib/error-handler');
require('dotenv-flow').config();

const { join } = require('path');
const { spawnSync } = require('child_process');

const logger = require('../libs/logger');
const { name } = require('../../package.json');

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
    ensureSharpInstalled();
    process.exit(0);
  } catch (err) {
    logger.error(`${name} pre-start error`, err.message);
    process.exit(1);
  }
})();
