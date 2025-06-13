const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('@blocklet/sdk/lib/config');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(config.env.dataDir, 'db/media-kit.db'),
  logging: false,
});

sequelize.query('pragma journal_mode = WAL;');
sequelize.query('pragma synchronous = normal;');
sequelize.query('pragma journal_size_limit = 67108864;');

const Folder = require('./folder')(sequelize);
const Upload = require('./upload')(sequelize);

module.exports = {
  sequelize,
  Folder,
  Upload,
};
