/* eslint-disable global-require */
const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('./index');

const umzug = new Umzug({
  migrations: {
    glob: ['**/migrations/*.{ts,js}', { cwd: __dirname }],
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

module.exports.umzug = umzug;

module.exports.migrate = async () => {
  await umzug.up();
};
