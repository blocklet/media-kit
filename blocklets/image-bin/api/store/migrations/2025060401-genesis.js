const omit = require('lodash/omit');
const { Folder, Upload } = require('../index');

module.exports = {
  up: async ({ context }) => {
    await context.createTable('folders', omit(Folder.rawAttributes, ['_id']));
    await context.createTable('uploads', omit(Upload.rawAttributes, ['_id']));

    await context.addIndex('uploads', ['filename']);
    await context.addIndex('uploads', ['folderId']);
    await context.addIndex('uploads', ['mimetype']);
    await context.addIndex('uploads', ['createdBy']);
    await context.addIndex('uploads', ['createdAt']);
    await context.addIndex('uploads', ['updatedAt']);

    await context.addIndex('folders', ['name']);
    await context.addIndex('folders', ['createdBy']);
    await context.addIndex('folders', ['createdAt']);
    await context.addIndex('folders', ['updatedAt']);
  },
  down: async ({ context }) => {
    await context.dropTable('uploads');
    await context.dropTable('folders');
  },
};
