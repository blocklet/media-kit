const { Folder, Upload } = require('../index');

module.exports = {
  up: async ({ context }) => {
    await context.createTable('folders', Folder.rawAttributes);
    await context.createTable('uploads', Upload.rawAttributes);

    await context.addIndex('uploads', ['filename']);
    await context.addIndex('uploads', ['folderId']);
    await context.addIndex('uploads', ['mimetype']);

    await context.addIndex('folders', ['name']);
  },
  down: async ({ context }) => {
    await context.dropTable('uploads');
    await context.dropTable('folders');
  },
};
