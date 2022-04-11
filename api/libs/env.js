const path = require('path');
const env = require('@blocklet/sdk/lib/env');

module.exports = {
  ...env,
  uploadDir: path.join(env.dataDir, 'uploads'),
};
