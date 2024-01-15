const path = require('path');
const { BlockletStatus } = require('@blocklet/constant');

const ResourceDid = 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9';
const ResourceType = 'imgpack';
const ExportDir = path.join(ResourceDid, ResourceType);

const runningStatus = BlockletStatus.running;

module.exports = {
  runningStatus,
  ResourceType,
  ResourceDid,
  ExportDir,
};
