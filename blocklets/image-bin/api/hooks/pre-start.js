const { migrate } = require('../migrations');
const logger = require('../libs/logger');

(async () => {
  try {
    await migrate();
    process.exit(0);
  } catch (err) {
    logger.error('[pre-start] failed', err);
    process.exit(1);
  }
})();
