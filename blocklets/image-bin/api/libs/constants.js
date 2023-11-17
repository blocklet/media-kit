const { BlockletStatus } = require('@blocklet/constant');

const ResourceType = 'imgpack';
const ExportDir = `export.${ResourceType}`;
const MediaTypes = [ResourceType];

const runningStatus = BlockletStatus.running;

module.exports = {
  runningStatus,
  MediaTypes,
  ResourceType,
  ExportDir,
};
