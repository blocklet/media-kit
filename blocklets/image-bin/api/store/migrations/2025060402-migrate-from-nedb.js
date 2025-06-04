/* eslint-disable no-console */
const { Folder, Upload, sequelize } = require('../index');
const FolderState = require('../../states/folder');
const UploadState = require('../../states/upload');

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

    // Batch insert into SQLite
    // eslint-disable-next-line no-await-in-loop
    await targetModel.bulkCreate(records, {
      transaction,
      validate: true,
      ignoreDuplicates: true, // Skip duplicates in case of retry
    });

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
      const folderCount = await migrateData(FolderState, Folder, 'folders', transaction);
      const uploadCount = await migrateData(UploadState, Upload, 'uploads', transaction);

      await transaction.commit();

      console.log('Data migration completed successfully!', { folderCount, uploadCount });
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
