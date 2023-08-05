const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const sharp = require('sharp');
const express = require('express');
const joinUrl = require('url-join');
const pick = require('lodash/pick');
const middleware = require('@blocklet/sdk/lib/middlewares');
const config = require('@blocklet/sdk/lib/config');
const mime = require('mime-types');

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
      createdBy: req.user.did,
      updatedBy: req.user.did,
    });
  }

  next();
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (env.preferences.types.includes(file.mimetype) === false) {
      cb(new Error(`${file.mimetype} files are not allowed`));
    } else {
      cb(null, true);
    }
  },
});

router.post('/uploads', user, auth, ensureComponentDid, upload.single('image'), async (req, res) => {
  let { buffer } = req.file;
  if (buffer.byteLength > +env.maxUploadSize) {
    res.status(400).send({ error: `your upload exceeds the maximum size ${env.maxUploadSize}` });
    return;
  }

  const hasher = crypto.createHash('md5');
  const [type, extension] = req.file.mimetype.split('/');
  if (type === 'image' && ['jpeg', 'png', 'webp'].includes(extension)) {
    buffer = await sharp(buffer)
      .resize({
        width: +process.env.MAX_IMAGE_WIDTH,
        height: +process.env.MAX_IMAGE_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .rotate()
      .ensureAlpha()
      .toBuffer();
  }

  hasher.update(buffer);
  const filename = `${hasher.digest('hex')}.${mime.extension(req.file.mimetype)}`;
  const destPath = path.join(env.uploadDir, filename);
  fs.writeFileSync(destPath, buffer);

  const obj = new URL(env.appUrl);
  obj.protocol = req.get('x-forwarded-proto') || req.protocol;
  obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', filename);

  const doc = await Upload.insert({
    ...pick(req.file, ['mimetype', 'originalname']),
    filename,
    size: fs.statSync(destPath).size,
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

  res.json({ url: obj.href, ...doc });
});

router.post('/sdk/uploads', middleware.component.verifySig, ensureComponentDid, async (req, res) => {
  const { type, filename: originalFilename, data } = req.body;
  if (!type || !originalFilename || !data) {
    res.json({ error: 'missing required body `type` or `filename` or `data`' });
    return;
  }

  // eslint-disable-next-line no-nested-ternary
  const buffer = type === 'base64' ? Buffer.from(data, 'base64') : type === 'path' ? fs.readFileSync(data) : null;
  if (!buffer) {
    res.json({ error: 'invalid upload type' });
    return;
  }

  const hash = crypto.createHash('md5');
  hash.update(buffer);
  const filename = `${hash.digest('hex')}${path.extname(originalFilename).replace(/\.+$/, '')}`;
  const filePath = path.join(env.uploadDir, filename);

  fs.writeFileSync(filePath, buffer);

  const file = { size: fs.lstatSync(filePath).size, filename, originalFilename, mimetype: mime.lookup(filename) || '' };

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
  });

  res.json({ url: obj.href, ...doc });
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

// preview image
router.get('/uploads/:filename', user, auth, async (req, res) => {
  const doc = await Upload.findOne({ filename: req.params.filename });
  res.jsonp(doc);
});

// remove upload
router.delete('/uploads/:id', user, ensureAdmin, async (req, res) => {
  const doc = await Upload.findOne({ _id: req.params.id });
  if (!doc) {
    res.jsonp({ error: 'No such upload' });
    return;
  }

  const result = await Upload.remove({ _id: req.params.id });
  if (result) {
    fs.unlinkSync(path.join(env.uploadDir, doc.filename));
  }

  res.jsonp(doc);
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

module.exports = router;
