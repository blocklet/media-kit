const { Folder, Upload } = require('../index');

module.exports = {
  up: async ({ context }) => {
    await context.createTable('folders', Folder.rawAttributes);
    await context.createTable('uploads', Upload.rawAttributes);
  },
  down: async ({ context }) => {
    await context.dropTable('uploads');
    await context.dropTable('folders');
  },
};
