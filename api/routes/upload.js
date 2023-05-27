const fs = require('fs');
const path = require('path');
const multer = require('multer');
const express = require('express');
const joinUrl = require('url-join');
const pick = require('lodash/pick');
const middleware = require('@blocklet/sdk/lib/middlewares');
const mime = require('mime-types');
const { customRandom, urlAlphabet, random } = require('nanoid');

const env = require('../libs/env');
const Upload = require('../states/upload');
const Folder = require('../states/folder');

const router = express.Router();
const nanoid = customRandom(urlAlphabet, 24, random);
const auth = middleware.auth({ roles: env.uploaderRoles });
const user = middleware.user();
const ensureAdmin = middleware.auth({ roles: ['admin', 'owner'] });
const generateFilename = () => `${Date.now()}-${nanoid()}`;

const upload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (req, file, cb) => {
      cb(null, `${generateFilename()}.${mime.extension(file.mimetype)}`);
    },
  }),
});

router.post('/uploads', user, auth, upload.single('image'), async (req, res) => {
  const obj = new URL(env.appUrl);
  obj.protocol = req.get('x-forwarded-proto') || req.protocol;
  obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', req.file.filename);

  const doc = await Upload.insert({
    ...pick(req.file, ['size', 'filename', 'mimetype', 'originalname']),
    remark: req.body.remark || '',
    tags: req.body.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.did,
    updatedBy: req.user.did,
  });

  res.json({ url: obj.href, ...doc });
});

router.post('/sdk/uploads', middleware.component.verifySig, async (req, res) => {
  const { type, filename: originalFilename, data } = req.body;
  if (!type || !originalFilename || !data) {
    res.json({ error: 'missing required body `type` or `filename` or `data`' });
    return;
  }

  const filename = `${generateFilename()}${path.extname(originalFilename).replace(/\.+$/, '')}`;
  const filePath = path.join(env.uploadDir, filename);

  if (type === 'base64') {
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  } else if (type === 'path') {
    if (!fs.existsSync(data)) {
      res.json({ error: 'upload file is not exists' });
      return;
    }
    fs.cpSync(data, filePath);
  } else {
    res.json({ error: 'invalid upload type' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.json({ error: 'invalid file' });
    return;
  }

  const file = { size: fs.lstatSync(filePath).size, filename, originalFilename, mimetype: mime.lookup(filename) || '' };

  const obj = new URL(env.appUrl);
  obj.protocol = req.get('x-forwarded-proto') || req.protocol;
  obj.pathname = joinUrl(req.headers['x-path-prefix'] || '/', '/uploads', file.filename);

  const doc = await Upload.insert({
    ...pick(file, ['size', 'filename', 'mimetype', 'originalname']),
    tags: req.body.tags || [],
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

  if (req.query.tags && req.query.tags.length > 0) {
    const tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
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
