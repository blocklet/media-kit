const fs = require('fs');
const path = require('path');
const express = require('express');
const toUpper = require('lodash/toUpper');
const flatten = require('lodash/flatten');
const { initStaticResourceMiddleware } = require('@blocklet/uploader-server');
const { getResourceExportDir, getResources } = require('@blocklet/sdk/lib/component');

const env = require('../libs/env');
const { Upload, Folder } = require('../models');
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
  // only for test pages kit resource (pages folder)
  // {
  //   type: 'page',
  //   did: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o',
  //   folder: ['pages', 'components'],
  //   blacklist: ['.yml'],
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
  const folders = await Folder.findAll({
    order: [['updatedAt', 'DESC']],
  });
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

  const uploads = flatten(
    await Promise.all(
      resources.map((folderId) =>
        Upload.findAll({
          where: { folderId },
        })
      )
    )
  );

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
    // eslint-disable-next-line require-await
    uploads.map(async ({ filename }) => {
      const filePath = path.join(env.uploadDir, filename);
      const newFilePath = path.join(dir, filename);

      if (!fs.existsSync(filePath)) {
        return;
      }

      fs.copyFileSync(filePath, newFilePath);
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
  getResourceComponents,
};
