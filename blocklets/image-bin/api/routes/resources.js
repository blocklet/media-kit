const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const toUpper = require('lodash/toUpper');
const flatten = require('lodash/flatten');
const { initStaticResourceMiddleware } = require('@blocklet/uploader/middlewares');
const { getResourceExportDir, getResources } = require('@blocklet/sdk/lib/component');

const env = require('../libs/env');
const Upload = require('../states/upload');
const Folder = require('../states/folder');
const { ResourceDid, ResourceType, ExportDir } = require('../libs/constants');
const { auth, user, ensureAdmin } = require('../libs/auth');

const resourceTypes = [
  {
    type: ResourceType,
    did: ResourceDid,
  },
  // only for test static resource
  // {
  //   type: 'postpack',
  //   did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu',
  // },
];

const router = express.Router();

const getResourceComponents = () => {
  const resources = getResources({ types: resourceTypes });
  return resources.map((x) => ({ ...x, name: x.title }));
};

const getResourceListMiddleware = () => {
  return (req, res) => {
    const { componentDid: inputComponentDid } = req.query;

    const components = getResourceComponents();

    const componentDid = inputComponentDid || components[0]?.did;
    const resourcePath = components.find((x) => x.did === componentDid)?.path;

    if (!fs.existsSync(resourcePath)) {
      res.jsonp({ components, componentDid, resources: [] });
      return;
    }

    const resources = fs.readdirSync(resourcePath).map((filename) => ({ filename }));

    res.jsonp({ components, componentDid, resources });
  };
};

router.get('/resources', user, auth, getResourceListMiddleware());

router.get('/resources/export', ensureAdmin, async (_req, res) => {
  const folders = await Folder.cursor({}).sort({ createdAt: -1 }).exec();
  const resources = (folders || []).map((x) => ({
    id: x._id,
    name: toUpper(x.name),
  }));

  res.json({ resources });
});

const getExportDir = (projectId, releaseId) => {
  const resourceDir = getResourceExportDir({ projectId, releaseId });
  const dir = path.join(resourceDir, ExportDir);
  return dir;
};

router.post('/resources/export', ensureAdmin, async (req, res) => {
  const { resources, projectId, releaseId } = req.body;

  const dir = getExportDir(projectId, releaseId);

  const uploads = flatten(await Promise.all(resources.map((folderId) => Upload.find({ folderId }))));

  if (!uploads.length) {
    fs.rmSync(dir, { recursive: true, force: true });
    res.json({});
    return;
  }

  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });

  await Promise.all(
    uploads.map(async ({ filename }) => {
      const filePath = path.join(env.uploadDir, filename);
      const newFilePath = path.join(dir, filename);

      if (!fs.existsSync(filePath)) {
        return;
      }

      await fs.copy(filePath, newFilePath);
    })
  );

  res.json({});
});

const staticResourceMiddleware = initStaticResourceMiddleware({
  express,
  resourceTypes,
});

module.exports = {
  router,
  staticResourceMiddleware,
};
