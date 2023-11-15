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
const { isValid: isValidDid } = require('@arcblock/did');
const { initLocalStorageServer, initCompanion, symlinkFileToNewPath } = require('@blocklet/uploader/middlewares');
const logger = require('../libs/logger');

const env = require('../libs/env');
const Upload = require('../states/upload');
const Folder = require('../states/folder');

const router = express.Router();
const auth = middleware.auth({ roles: env.uploaderRoles });
const user = middleware.user();
const ensureAdmin = middleware.auth({ roles: ['admin', 'owner'] });

const ensureFolderId = async (req, res, next) => {
  req.componentDid = req.headers['x-component-did'] || process.env.BLOCKLET_COMPONENT_DID;

  const component = config.components.find((x) => x.did === req.componentDid);
  const folder = await Folder.findOne({ _id: req.componentDid });

  if (!component && !folder) {
    res.status(400).send({ error: `component or folderId ${req.componentDid} is not registered` });
    return;
  }

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

const getSymlinkPath = (req) => {
  // not current component
  if (isValidDid(req.componentDid) && req.componentDid !== env.currentComponentInfo.did) {
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
};

const symlinkWrapper = async ({ req, fileName, filePath, componentDid }) => {
  // rewrite
  if (componentDid) {
    req.componentDid = componentDid;
  }
  // try to symlink
  let symlinkFilePath = await getSymlinkPath(req);

  if (typeof symlinkFilePath === 'string' && symlinkFilePath) {
    if (symlinkFilePath?.indexOf(fileName) === -1) {
      // symlinkFilePath may be not with fileName
      symlinkFilePath = path.join(symlinkFilePath, fileName);
    }

    try {
      await symlinkFileToNewPath(filePath, symlinkFilePath);
      // TODO not json file
      // await symlinkFileToNewPath(`${filePath}.json`, `${symlinkFilePath}.json`);
    } catch (error) {
      console.error('copy file error: ', error);
    }
  }
};

// multer only use for /sdk/uploads, not filter allow type
const upload = multer({
  storage: multer.memoryStorage(),
});

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const getUploadListMiddleware = ({ maxPageSize = MAX_PAGE_SIZE, checkUserRole = true } = {}) => {
  return async (req, res) => {
    let page = Number(req.query.page || 1);
    let pageSize = Number(req.query.pageSize || DEFAULT_PAGE_SIZE);

    page = Number.isNaN(page) ? 1 : page;
    pageSize = Number.isNaN(pageSize) ? DEFAULT_PAGE_SIZE : pageSize;
    pageSize = pageSize > maxPageSize ? maxPageSize : pageSize;

    const condition = {};

    if (req.query.folderId) {
      condition.folderId = req.query.folderId;
    }

    if (checkUserRole && [('guest', 'member')].includes(req.user.role)) {
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
  };
};

router.get('/uploads', user, auth, getUploadListMiddleware());

// remove upload
router.delete('/uploads/:id', user, ensureAdmin, ensureFolderId, async (req, res) => {
  const mediaKitDid = env.currentComponentInfo.did;

  if (isValidDid(req.componentDid) && req.componentDid !== mediaKitDid) {
    res.jsonp({ error: `Can not remove file by ${req.componentDid}` });
    return;
  }

  const doc = await Upload.findOne({ _id: req.params.id });

  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  if (isValidDid(doc.folderId) && doc.folderId !== mediaKitDid) {
    res.jsonp({ error: 'Can not remove file which upload from other blocklet' });
    return;
  }

  const result = await Upload.remove({ _id: req.params.id });

  if (result) {
    const count = await Upload.count({ filename: doc.filename });
    if (count === 0) {
      await localStorageServer.delete(doc.filename);
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

  const { filename, folderId } = updatedDoc;

  // rewrite componentDID
  await symlinkWrapper({
    req,
    fileName: filename,
    filePath: path.join(env.uploadDir, updatedDoc.filename),
    componentDid: folderId,
  });

  res.jsonp(updatedDoc);
});

// init uploader server
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir,
  express,
  symlinkPath: getSymlinkPath,
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

router.use('/uploads', user, auth, ensureFolderId, localStorageServer.handle);

const defaultCompanionOptions = {
  path: env.uploadDir,
  express,
  uploadUrls: [env.appUrl],
};

// companion
const companion = initCompanion({
  ...defaultCompanionOptions,
  providerOptions: env.getProviderOptions(),
});

// auto update
config.events.on(config.Events.envUpdate, () => {
  logger.info('env update, try to re-init companion now');
  env.updateEnv();
  // wait for env update
  setTimeout(() => {
    companion.setProviderOptions(env.getProviderOptions());
  }, 200);
});

router.use('/companion', user, auth, ensureFolderId, companion.handle);

router.post(
  '/sdk/uploads',
  user,
  middleware.component.verifySig,
  upload.single('data'),
  ensureFolderId,
  async (req, res) => {
    // data maybe a file buffer format by multer
    const { type, filename: originalFileName, data = req?.file?.buffer, repeatInsert = true } = req.body;

    if (!type || !originalFileName || !data) {
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

    const fileName = `${hash.digest('hex')}${path.extname(originalFileName).replace(/\.+$/, '')}`;
    const filePath = path.join(env.uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    await symlinkWrapper({
      req,
      fileName,
      filePath,
    });

    const file = {
      size: fs.lstatSync(filePath).size,
      filename: fileName,
      originalname: originalFileName,
      mimetype: mime.lookup(fileName) || '',
    };

    // current url
    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', file.filename);

    const extraResult = {
      url: obj.href,
    };

    if (['false', false].includes(repeatInsert)) {
      const existItem = await Upload.findOne(file);
      if (existItem) {
        res.json({ ...extraResult, ...existItem, repeat: true });
        return;
      }
    }
    const doc = await Upload.insert({
      ...pick(file, ['size', 'filename', 'originalname', 'mimetype']),
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

    res.json({ ...extraResult, ...doc });
  }
);

router.get(
  '/sdk/uploads',
  user,
  middleware.component.verifySig,
  getUploadListMiddleware({
    maxPageSize: Infinity,
    checkUserRole: false,
  })
);

router.all('/sdk/uploads/find', user, middleware.component.verifySig, async (req, res) => {
  let extraResult = {};

  const queryParams = {
    ...req.query,
    ...req.body,
  };

  if (queryParams.tags) {
    const tags = queryParams.tags
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    queryParams.tags = { $in: tags };
  }

  const existItem = await Upload.findOne(queryParams);

  if (existItem) {
    // current url
    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', existItem.filename);

    extraResult = {
      url: obj.href,
    };

    res.json({ ...extraResult, ...existItem });
  } else {
    res.json(null);
  }
});

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

router.post('/image/generations', user, auth, async (req, res) => {
  const { prompt, number, sizeWidth, responseFormat } = req.body;

  const response = await Component.call({
    name: 'ai-kit',
    path: '/api/v1/sdk/image/generations',
    method: 'POST',
    data: {
      model: 'dall-e-3',
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

router.get('/uploader/status', async (req, res) => {
  const availablePluginMap = {
    AIImage: false,
    Unsplash: false,
  };

  const AIKit = config.components?.find((item) => item.did === 'z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ');

  if (AIKit) {
    // can use AIImage
    await Component.call({
      name: 'ai-kit',
      path: '/api/v1/sdk/status',
      method: 'GET',
      data: {},
    })
      .then(({ data }) => {
        availablePluginMap.AIImage = data.available;
      })
      .catch(() => {
        // do nothing
      });
  }

  // can use Unsplash
  if (config.env.UNSPLASH_KEY && config.env.UNSPLASH_SECRET) {
    availablePluginMap.Unsplash = true;
  }

  res.json({ availablePluginMap });
});

module.exports = router;
