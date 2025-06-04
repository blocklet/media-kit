const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('../models');

const umzug = new Umzug({
  migrations: {
    glob: ['*.js', { cwd: __dirname, ignore: ['**/index.js'] }],
    resolve: ({ name, path, context }) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const migration = require(path);
      return {
        name: name.replace(/\.ts$/, '.js'),
        up: () => migration.up({ context, sequelize }),
        down: () => migration.down({ context, sequelize }),
      };
    },
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

// Export the initialized umzug instance
module.exports.umzug = umzug;

// Export a function to run migrations
module.exports.migrate = async () => {
  await umzug.up();
};
