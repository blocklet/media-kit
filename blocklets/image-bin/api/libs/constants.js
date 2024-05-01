const path = require('path');
const { BlockletStatus } = require('@blocklet/constant');

const MEDIA_KIT_DID = 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9';
const ResourceDid = MEDIA_KIT_DID;
const ResourceType = 'imgpack';
const ExportDir = path.join(ResourceDid, ResourceType);

const runningStatus = BlockletStatus.running;

module.exports = {
  runningStatus,
  ResourceType,
  ResourceDid,
  ExportDir,
  MEDIA_KIT_DID,
};
