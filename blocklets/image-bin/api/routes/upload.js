const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const joinUrl = require('url-join');
const pick = require('lodash/pick');
const multer = require('multer');
const middleware = require('@blocklet/sdk/lib/middlewares');
const config = require('@blocklet/sdk/lib/config');
const mime = require('mime-types');
const Component = require('@blocklet/sdk/lib/component');

const { initLocalStorageServer, initCompanion } = require('@blocklet/uploader/middlewares');

const env = require('../libs/env');
const Upload = require('../states/upload');
const Folder = require('../states/folder');

const router = express.Router();
const auth = middleware.auth({ roles: env.uploaderRoles });
const user = middleware.user();
const ensureAdmin = middleware.auth({ roles: ['admin', 'owner'] });

const ensureComponentDid = async (req, res, next) => {
  req.componentDid = req.headers['x-component-did'] || process.env.BLOCKLET_COMPONENT_DID;

  const component = config.components.find((x) => x.did === req.componentDid);

  if (!component) {
    res.status(400).send({ error: `component ${req.componentDid} is not registered` });
    return;
  }

  const folder = await Folder.findOne({ _id: req.componentDid });
  if (!folder) {
    await Folder.insert({
      _id: req.componentDid,
      name: component.title || component.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.did,
      updatedBy: req.user?.did,
    });
  }

  next();
};

// multer only use for /sdk/uploads, not filter allow type
const upload = multer({
  storage: multer.memoryStorage(),
});

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

router.get('/uploads', user, auth, async (req, res) => {
  let page = Number(req.query.page || 1);
  let pageSize = Number(req.query.pageSize || DEFAULT_PAGE_SIZE);

  page = Number.isNaN(page) ? 1 : page;
  pageSize = Number.isNaN(pageSize) ? DEFAULT_PAGE_SIZE : pageSize;
  pageSize = pageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : pageSize;

  const condition = {};
  if (req.query.folderId) {
    condition.folderId = req.query.folderId;
  }

  if (['guest', 'member'].includes(req.user.role)) {
    condition.createdBy = req.user.did;
  }

  if (req.query.tags) {
    const tags = req.query.tags
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    condition.tags = { $in: tags };
  }

  const uploads = await Upload.paginate({ condition, sort: { createdAt: -1 }, page, size: pageSize });
  const total = await Upload.count(condition);

  const folders = await Folder.cursor({}).sort({ createdAt: -1 }).exec();

  res.jsonp({ uploads, folders, total, page, pageSize, pageCount: Math.ceil(total / pageSize) });
});

// remove upload
router.delete('/uploads/:id', user, ensureAdmin, ensureComponentDid, async (req, res) => {
  const mediaKitDid = env.currentComponentInfo.did;

  if (req.componentDid !== mediaKitDid) {
    res.jsonp({ error: `Can not remove file by ${req.componentDid}` });
    return;
  }

  const doc = await Upload.findOne({ _id: req.params.id });

  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  if (doc.folderId !== mediaKitDid) {
    res.jsonp({ error: 'Can not remove file which upload from other blocklet' });
    return;
  }

  const result = await Upload.remove({ _id: req.params.id });

  if (result) {
    const count = await Upload.count({ filename: doc.filename });
    if (count === 0) {
      try {
        fs.unlinkSync(path.join(env.uploadDir, doc.filename));
        // remove meta file
        fs.unlinkSync(path.join(env.uploadDir, `${doc.filename}.json`));
      } catch (error) {
        // ignore
      }
    }
  }

  res.jsonp(doc);
});

// move to folder
router.put('/uploads/:id', user, ensureAdmin, async (req, res) => {
  const doc = await Upload.findOne({ _id: req.params.id });
  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  const [, updatedDoc] = await Upload.update(
    { _id: req.params.id },
    { $set: pick(req.body, ['folderId']) },
    { returnUpdatedDocs: true }
  );

  res.jsonp(updatedDoc);
});

// init uploader server
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir,
  express,
  symlinkPath: (req) => {
    // not current component
    if (req.componentDid !== env.currentComponentInfo.did) {
      const component = config.components.find((x) => x.did === req.componentDid);
      // if exist component, use component name as symlink path
      if (component) {
        const symlinkPath = path.join(env.uploadDir.replace(env.currentComponentInfo.name, component.name));
        // if symlink path dir exist, use it
        if (fs.existsSync(symlinkPath)) {
          return symlinkPath;
        }
      }
    }
    return null;
  },
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', filename);

    const doc = await Upload.insert({
      mimetype,
      originalname,
      filename,
      size,
      remark: req.body.remark || '',
      tags: (req.body.tags || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      folderId: req.componentDid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.did,
      updatedBy: req.user.did,
    });

    const resData = { url: obj.href, ...doc };

    return resData;
  },
});

router.use('/uploads', user, auth, ensureComponentDid, localStorageServer.handle);

// companion
const companion = initCompanion({
  path: env.uploadDir,
  express,
  providerOptions: env.providerOptions,
  uploadUrls: [env.appUrl],
});

router.use('/companion', user, auth, ensureComponentDid, companion.handle);

router.post(
  '/sdk/uploads',
  user,
  middleware.component.verifySig,
  upload.single('data'),
  ensureComponentDid,
  async (req, res) => {
    // data maybe a file buffer format by multer
    const { type, filename: originalFilename, data = req?.file?.buffer } = req.body;

    if (!type || !originalFilename || !data) {
      res.json({ error: 'missing required body `type` or `filename` or `data`' });
      return;
    }

    let buffer = null;

    if (type === 'base64') {
      buffer = Buffer.from(data, 'base64');
    } else if (type === 'path') {
      buffer = fs.readFileSync(data);
    } else if (type === 'file') {
      buffer = data;
    }

    if (!buffer) {
      res.json({ error: 'invalid upload type, should be [file, path, base64]' });
      return;
    }

    const hash = crypto.createHash('md5');
    hash.update(buffer);

    const filename = `${hash.digest('hex')}${path.extname(originalFilename).replace(/\.+$/, '')}`;
    const filePath = path.join(env.uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const file = {
      size: fs.lstatSync(filePath).size,
      filename,
      originalFilename,
      mimetype: mime.lookup(filename) || '',
    };

    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', file.filename);

    const doc = await Upload.insert({
      ...pick(file, ['size', 'filename', 'mimetype', 'originalname']),
      tags: (req.body.tags || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      folderId: req.componentDid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user?.did,
      updatedBy: req.user?.did,
    });

    res.json({ url: obj.href, ...doc });
  }
);

// create folder
router.post('/folders', user, ensureAdmin, async (req, res) => {
  const name = req.body.name.trim();
  if (!name) {
    res.jsonp({ error: 'folder name required' });
    return;
  }

  const exist = await Folder.findOne({ name });
  if (exist) {
    res.json(exist);
    return;
  }

  const doc = await Folder.insert({
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.did,
    updatedBy: req.user.did,
  });

  res.json(doc);
});

router.post('/image/generations', async (req, res) => {
  const { prompt, number, sizeWidth, responseFormat } = req.body;

  const response = await Component.call({
    name: 'ai-kit',
    path: '/api/v1/sdk/image/generations',
    method: 'POST',
    data: {
      prompt,
      n: parseInt(number, 10),
      size: `${sizeWidth}x${sizeWidth}`,
      response_format: responseFormat,
    },
    responseType: 'stream',
  });
  res.set('Content-Type', response.headers['content-type']);
  response.data.pipe(res);
});

module.exports = router;
