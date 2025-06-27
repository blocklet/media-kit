const fs = require('fs');
const path = require('path');
const express = require('express');
const joinUrl = require('url-join');
const pick = require('lodash/pick');
const middleware = require('@blocklet/sdk/lib/middlewares');
const config = require('@blocklet/sdk/lib/config');
const mime = require('mime-types');
const Component = require('@blocklet/sdk/lib/component');

const { LRUCache } = require('lru-cache');
const { isValid: isValidDID } = require('@arcblock/did');
const xbytes = require('xbytes');

const uniq = require('lodash/uniq');
const multer = require('multer');
const { pipeline } = require('stream/promises');
// HACK: 是可以 resolve 到的，eslint 却会报错，所以暂时禁用
// eslint-disable-next-line import/no-unresolved
const { initLocalStorageServer, initCompanion, getFileHash, removeExifFromFile } = require('@blocklet/uploader-server');
// HACK: 是可以 resolve 到的，eslint 却会报错，所以暂时禁用
// eslint-disable-next-line import/no-unresolved
const { checkTrustedReferer } = require('@blocklet/uploader-server');
const { sanitizeSvg, isSvgFile } = require('@blocklet/xss');
const logger = require('../libs/logger');
const { MEDIA_KIT_DID } = require('../libs/constants');
const { getResourceComponents } = require('./resources');
const env = require('../libs/env');
const { Upload, Folder } = require('../store');

const { user, auth, ensureAdmin } = require('../libs/auth');

const router = express.Router();

const statusCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5, // 5min
});

const ensureFolderId = () => async (req, res, next) => {
  req.componentDid = req.headers['x-component-did'] || MEDIA_KIT_DID;

  const isDID = isValidDID(req.componentDid);

  if (isDID) {
    const folder = await Folder.findOne({ where: { id: req.componentDid } });
    const component = config.components.find((x) => x.did === req.componentDid);

    if (!component) {
      res.status(400).send({ error: `component ${req.componentDid} is not registered` });
      return;
    }

    if (!folder) {
      await Folder.create({
        id: req.componentDid,
        name: component.title || component.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: req.user?.did,
        updatedBy: req.user?.did,
      });
    }
  }

  next();
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const getUploadListMiddleware = ({ maxPageSize = MAX_PAGE_SIZE } = {}) => {
  return async (req, res) => {
    let page = Number(req.query.page || 1);
    let pageSize = Number(req.query.pageSize || DEFAULT_PAGE_SIZE);

    page = Number.isNaN(page) ? 1 : page;
    pageSize = Number.isNaN(pageSize) ? DEFAULT_PAGE_SIZE : pageSize;
    pageSize = pageSize > maxPageSize ? maxPageSize : pageSize;

    const isMediaKitRequest = req.componentDid === MEDIA_KIT_DID;

    // default can only see self uploads
    const condition = {
      createdBy: req.user?.did,
    };

    if (isMediaKitRequest && ['admin', 'owner'].includes(req.user.role)) {
      // logger.log('request role is admin / owner');
      // allow admin to see all uploads
      delete condition.createdBy;

      // allow admin to filter by createdBy
      if (req.query.createdBy) {
        condition.createdBy = req.query.createdBy;
      }
    }

    if (req.query.folderId) {
      condition.folderId = req.query.folderId;
    }

    if (req.query.tags) {
      const tags = req.query.tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      condition.tags = { $in: tags };
    }

    const { count: total, rows: uploads } = await Upload.findAndCountAll({
      where: condition,
      order: [
        ['createdAt', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
      offset: (page - 1) * pageSize,
      limit: pageSize,
    });

    const folders = await Folder.findAll({
      order: [
        ['createdAt', 'DESC'],
        ['updatedAt', 'DESC'],
      ],
    });

    res.jsonp({ uploads, folders, total, page, pageSize, pageCount: Math.ceil(total / pageSize) });
  };
};

router.get('/uploads', user, auth, ensureFolderId(), getUploadListMiddleware());

// remove upload
router.delete('/uploads/:id', user, ensureAdmin, ensureFolderId(), async (req, res) => {
  const mediaKitDid = env.currentComponentInfo.did;

  if (isValidDID(req.componentDid) && req.componentDid !== mediaKitDid) {
    res.jsonp({ error: `Can not remove file by ${req.componentDid}` });
    return;
  }

  const doc = await Upload.findOne({ where: { id: req.params.id } });

  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  // admin can remove all files
  if (isValidDID(doc.folderId) && doc.folderId !== mediaKitDid && !['admin', 'owner'].includes(req.user.role)) {
    res.jsonp({ error: 'Can not remove file which upload from other blocklet' });
    return;
  }

  const result = await Upload.destroy({ where: { id: req.params.id } });

  if (result) {
    const count = await Upload.count({ where: { filename: doc.filename } });
    if (count === 0) {
      // eslint-disable-next-line no-use-before-define
      await localStorageServer.delete(doc.filename);
    }
  }

  res.jsonp(doc);
});

// move to folder
router.put('/uploads/:id', user, ensureAdmin, async (req, res) => {
  const doc = await Upload.findOne({ where: { id: req.params.id } });
  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  await Upload.update(pick(req.body, ['folderId']), { where: { id: req.params.id } });
  const updatedDoc = await Upload.findOne({ where: { id: req.params.id } });

  res.jsonp(updatedDoc);
});

// init uploader server
const localStorageServer = initLocalStorageServer({
  path: env.uploadDir,
  express,
  onUploadFinish: async (req, res, uploadMetadata) => {
    const {
      id: filename,
      size,
      metadata: { filename: originalname, filetype: mimetype },
    } = uploadMetadata;

    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', filename);

    const file = {
      size,
      filename,
      mimetype,
      // should filter by createdBy
      createdBy: req.user.did,
    };

    let doc = await Upload.findOne({ where: file });

    // if file not exist, insert it
    if (!doc) {
      doc = await Upload.create({
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
    } else {
      logger.info('file already exist, update it');
      await Upload.update(
        {
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.did,
        },
        { where: { id: doc.id } }
      );
      doc = await Upload.findOne({ where: { id: doc.id } });
    }

    const resData = { url: obj.href, ...doc.toJSON() };

    return resData;
  },
  // only for debug uploader
  // onUploadCreate(req, res, uploadMetadata) {
  //   console.warn(uploadMetadata);
  //   throw new Error('debug error');
  // },
});

router.use('/uploads', checkTrustedReferer, user, auth, ensureFolderId(), localStorageServer.handle);

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
  statusCache.clear();
  // wait for env update
  setTimeout(() => {
    companion.setProviderOptions(env.getProviderOptions());
  }, 200);
});

router.use('/companion', user, auth, ensureFolderId(), companion.handle);

const tempUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, env.uploadTempDir);
    },
    filename: (req, file, cb) => {
      // 使用时间戳作为临时文件名
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
});

const ensureFileMetadata = (filePath, { fileName, fileSize, originalFileName, fileType }) => {
  if (!fs.existsSync(`${filePath}.json`)) {
    const metadata = {
      id: fileName,
      size: fileSize,
      offset: fileSize,
      metadata: {
        uploaderId: 'Media Kit SDK',
        relativePath: originalFileName,
        name: originalFileName,
        type: fileType,
        filetype: fileType,
        filename: originalFileName,
      },
      creation_date: new Date().toISOString(),
    };
    fs.writeFileSync(`${filePath}.json`, JSON.stringify(metadata));
  }
};

router.post(
  '/sdk/uploads',
  (req, res, next) => {
    // use upload sig to verify if exist
    if (req.headers['x-component-upload-sig']) {
      req.headers['x-component-sig'] = req.headers['x-component-upload-sig'];
    }
    next();
  },
  user,
  tempUpload.single('file'),
  middleware.component.verifySig,
  ensureFolderId(),
  async (req, res) => {
    const { filename: originalFileName, base64, repeatInsert = false } = req.body || {};

    if (base64) {
      // write to temp file
      const tempFilePath = path.join(env.uploadTempDir, `${Date.now()}-${originalFileName}`);
      // Remove data URI scheme prefix if present
      const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(tempFilePath, Buffer.from(cleanBase64, 'base64'));
      req.file = {
        path: tempFilePath,
        originalname: originalFileName,
      };
    }

    if (!req.file.path) {
      res.json({
        error: 'invalid upload file',
        base64,
      });
      return;
    }

    const tempFilePath = req.file.path;

    const content = await fs.promises.readFile(tempFilePath, 'utf8');

    // check if the file is svg
    const isSvg = isSvgFile(content);

    if (isSvg) {
      try {
        const cleanedContent = sanitizeSvg(content);
        if (content !== cleanedContent) {
          await fs.promises.writeFile(tempFilePath, cleanedContent);
          logger.info('Sanitized SVG file to prevent XSS attack', { filePath: tempFilePath });
        }
      } catch (err) {
        logger.warn('Failed to sanitize SVG file:', err);
        res.status(400).json({
          error: 'Invalid SVG file',
        });
        return;
      }
    }

    // Calculate file size without loading entire file
    const stats = fs.statSync(tempFilePath);
    const fileSize = stats.size;

    // Replace the existing hash calculation in the /sdk/uploads route
    const fileHash = await getFileHash(tempFilePath);
    const fileName = `${fileHash}${path.extname(originalFileName).replace(/\.+$/, '')}`;
    const filePath = path.join(env.uploadDir, fileName);
    const fileType = req?.file?.mimetype || mime.lookup(fileName) || '';

    const file = {
      size: fileSize,
      filename: fileName,
      mimetype: fileType,
      createdBy: req.user?.did,
    };

    // current url
    const obj = new URL(env.appUrl);
    obj.protocol = req.get('x-forwarded-proto') || req.protocol;
    obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', file.filename);

    const extraResult = {
      url: obj.href,
    };

    if (['false', false].includes(repeatInsert)) {
      const existItem = await Upload.findOne({ where: file });
      const existFile = await fs.existsSync(filePath);
      if (existItem && existFile) {
        const existingStats = fs.statSync(filePath);
        if (existingStats.size === fileSize) {
          ensureFileMetadata(filePath, { fileName, fileSize, originalFileName, fileType });
          logger.info('file already exist with same size, skip repeat insert');
          res.json({ ...extraResult, ...existItem, repeat: true });
          return;
        }
      }
    }

    // remove exif from file
    try {
      await removeExifFromFile(tempFilePath);
    } catch (err) {
      logger.error('failed to remove EXIF from file', err);
    }

    // Stream file to destination only if file doesn't exist or has different size
    await pipeline(fs.createReadStream(tempFilePath), fs.createWriteStream(filePath));

    // Ensure metadata for new file
    ensureFileMetadata(filePath, { fileName, fileSize, originalFileName, fileType });

    // Remove temp file
    try {
      await fs.promises.unlink(tempFilePath);
    } catch (err) {
      logger.warn('Failed to clean up temp file:', err);
    }

    const doc = await Upload.create({
      ...pick(file, ['size', 'filename', 'mimetype']),
      tags: (req.body.tags || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      folderId: req.componentDid,
      originalname: originalFileName || fileName,
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
  ensureFolderId(),
  getUploadListMiddleware({
    maxPageSize: Infinity,
  })
);

// remove upload for sdk
router.delete('/sdk/uploads/:id', user, middleware.component.verifySig, async (req, res) => {
  const doc = await Upload.findOne({ where: { id: req.params.id } });

  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  if (isValidDID(req.user.did) && req.user.did !== doc.createdBy) {
    res.jsonp({ error: `Can not remove file by ${req.user.did}` });
    return;
  }

  // double check the file path is valid
  const filePath = path.join(env.uploadDir, doc.filename);
  if (!filePath.startsWith(env.uploadDir)) {
    res.jsonp({ error: 'Invalid file path' });
    return;
  }

  const result = await Upload.destroy({ where: { id: req.params.id } });

  if (result) {
    const count = await Upload.count({ where: { filename: doc.filename } });
    if (count === 0) {
      await localStorageServer.delete(doc.filename);
    }
  }

  res.jsonp(doc);
});

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

  const existItem = await Upload.findOne({ where: queryParams });

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

  const exist = await Folder.findOne({ where: { name } });
  if (exist) {
    res.json(exist);
    return;
  }

  const doc = await Folder.create({
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.did,
    updatedBy: req.user.did,
  });

  res.json(doc);
});

router.post('/image/generations', user, auth, async (req, res) => {
  const { prompt, number = 1, size = '1024x1024', responseFormat, model = 'dall-e-2' } = req.body;

  const response = await Component.call({
    name: 'ai-kit',
    path: '/api/v1/sdk/image/generations',
    method: 'POST',
    data: { model, prompt, size, n: parseInt(number, 10), responseFormat },
    responseType: 'stream',
  });

  res.set('Content-Type', response.headers['content-type']);
  response.data.pipe(res);
});

router.get('/uploader/status', async (req, res) => {
  req.componentDid = req.headers['x-component-did'];

  const cachedStatus = statusCache.get(req.componentDid);

  if (cachedStatus) {
    res.json(cachedStatus);
    return;
  }

  // setting available plugins
  const availablePluginMap = {
    AIImage: false,
    Unsplash: false,
    Uploaded: false,
    Resources: false,
  };

  const AIKit = config.components?.find((item) => item.did === 'z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ');

  if (AIKit) {
    // can use AIImage
    await Component.call({ name: 'ai-kit', path: '/api/v1/sdk/status', method: 'GET', data: {} })
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

  // can use Uploaded
  const folder = await Folder.findOne({ where: { id: req.componentDid } });
  const component = config.components.find((x) => x.did === req.componentDid);

  // mean this is a valid folder and upload image to this folder
  if (folder && component) {
    availablePluginMap.Uploaded = true;
  }

  if (getResourceComponents().length > 0) {
    // can use Resources
    availablePluginMap.Resources = true;
  }

  const defaultExtsInput = '.jpeg,.png,.gif,.svg,.webp,.bmp,.ico';

  const { types, maxUploadSize } = config.env.preferences || {};

  let { extsInput } = config.env.preferences || {};

  if (!extsInput) {
    extsInput = defaultExtsInput;
  }

  let allowedFileTypes = [];

  // extsInput only will be string
  if (typeof extsInput === 'string') {
    allowedFileTypes = uniq(
      extsInput
        ?.split(',')
        ?.map((ext) => mime.lookup(ext?.replaceAll(' ', '') || ''))
        ?.filter((x) => x)
    );
  } else if (Array.isArray(types)) {
    // Deprecated history prefs
    allowedFileTypes = types;
  }

  // not use iec
  const maxFileSize = xbytes.parseSize(maxUploadSize, { iec: false }) || Infinity;

  const restrictions = {
    allowedFileTypes,
    maxFileSize,
  };

  const statusResult = {
    availablePluginMap,
    preferences: {
      extsInput,
      maxUploadSize,
    },
    restrictions,
  };

  statusCache.set(req.componentDid, statusResult);

  res.json(statusResult);
});

module.exports = router;
