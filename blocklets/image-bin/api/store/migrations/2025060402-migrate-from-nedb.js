/* eslint-disable no-console */
const path = require('path');
const fs = require('fs');
const { Folder, Upload, sequelize } = require('../index');
const env = require('../../libs/env');

const BATCH_SIZE = 1000;

// migrate data from nedb to sqlite in batches
async function migrateData(sourceState, targetModel, dataType, transaction) {
  console.log(`Start to migrate ${dataType} from nedb to sqlite...`);

  let skip = 0;
  let migratedCount = 0;
  const totalCount = await sourceState.count({});

  // eslint-disable-next-line no-constant-condition
  while (totalCount > 0) {
    // Query nedb
    // eslint-disable-next-line no-await-in-loop
    const records = await sourceState.cursor({}).skip(skip).limit(BATCH_SIZE).exec();

    if (records.length === 0) break;

    // transform _id to id
    records.forEach((record) => {
      // fix id
      record.id = record.id || record._id;
      delete record._id;

      // fix time
      record.createdAt =
        // eslint-disable-next-line no-nested-ternary
        record.createdAt instanceof Date
          ? record.createdAt.toISOString()
          : typeof record.createdAt === 'string'
          ? record.createdAt
          : null;

      record.updatedAt =
        // eslint-disable-next-line no-nested-ternary
        record.updatedAt instanceof Date
          ? record.updatedAt.toISOString()
          : typeof record.updatedAt === 'string'
          ? record.updatedAt
          : null;
    });

    // Batch insert into SQLite
    try {
      // eslint-disable-next-line no-await-in-loop
      await targetModel.bulkCreate(records, {
        transaction,
        validate: true,
        ignoreDuplicates: true, // Skip duplicates in case of retry
      });
    } catch (error) {
      console.error('bulk create failed', { records, error });
      throw error;
    }

    migratedCount += records.length;
    skip += BATCH_SIZE;

    console.log(`Process ${migratedCount} / ${totalCount}`);

    // If we got less than BATCH_SIZE, we're done
    if (records.length < BATCH_SIZE) break;
  }

  console.log(`${dataType} migration completed ${migratedCount} / ${totalCount}`);
  return migratedCount;
}

module.exports = {
  up: async () => {
    console.log('Start migrating data from NeDB to SQLite...');

    const transaction = await sequelize.transaction();

    try {
      const folderDbPath = path.join(env.dataDir, 'db/folders.db');
      const uploadDbPath = path.join(env.dataDir, 'db/uploads.db');

      if (fs.existsSync(folderDbPath)) {
        // eslint-disable-next-line global-require
        const FolderState = require('../../states/folder');
        await migrateData(FolderState, Folder, 'folders', transaction);
      }

      if (fs.existsSync(uploadDbPath)) {
        // eslint-disable-next-line global-require
        const UploadState = require('../../states/upload');
        await migrateData(UploadState, Upload, 'uploads', transaction);
      }

      await transaction.commit();
      console.log('Data migration completed successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Data migration failed, rolled back:', error);
      throw error;
    }
  },

  down: async () => {
    await Folder.destroy({ truncate: true });
    await Upload.destroy({ truncate: true });
  },
};
