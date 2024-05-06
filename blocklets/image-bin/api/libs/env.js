const path = require('path');
const config = require('@blocklet/sdk/lib/config');
const logger = require('./logger');

const currentComponentInfo = config.components.find((x) => x.did === 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9');

let envMap = {};

const updateEnv = () => {
  logger.info('updating image bin env');
  envMap = {
    ...config.env,
    uploadDir: path.join(config.env.dataDir, 'uploads'),
    getProviderOptions: () => {
      const providerOptions = {};
      // unsplash
      if (config.env.UNSPLASH_KEY && config.env.UNSPLASH_SECRET) {
        providerOptions.unsplash = {
          key: config.env.UNSPLASH_KEY,
          secret: config.env.UNSPLASH_SECRET,
        };
      }
      return providerOptions;
    },
    currentComponentInfo,
  };
};

updateEnv();

module.exports = {
  ...envMap,
  updateEnv,
};
