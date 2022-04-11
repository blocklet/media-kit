const multer = require('multer');
const express = require('express');
const joinUrl = require('url-join');
const pick = require('lodash/pick');
const middleware = require('@blocklet/sdk/lib/middlewares');
const mime = require('mime-types');
const { customRandom, urlAlphabet, random } = require('nanoid');

const env = require('../libs/env');
const Upload = require('../states/upload');

const router = express.Router();
const nanoid = customRandom(urlAlphabet, 24, random);
const auth = middleware.auth({ roles: ['owner', 'admin'] });
const user = middleware.user();
const upload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${nanoid()}.${mime.extension(file.mimetype)}`);
    },
  }),
});

router.post('/uploads', user, auth, upload.single('image'), async (req, res) => {
  const obj = new URL(env.appUrl);
  obj.protocol = req.get('x-forwarded-proto') || req.protocol;
  obj.pathname = joinUrl('/uploads', req.file.filename);

  const doc = await Upload.insert({
    ...pick(req.file, ['size', 'filename', 'mimetype', 'originalname']),
    remark: req.body.remark || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: req.user.did,
    updatedBy: req.user.did,
  });

  res.json({ url: obj.href, ...doc });
});

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
router.get('/uploads', auth, async (req, res) => {
  let page = Number(req.query.page || 1);
  let pageSize = Number(req.query.pageSize || DEFAULT_PAGE_SIZE);

  page = Number.isNaN(page) ? 1 : page;
  pageSize = Number.isNaN(pageSize) ? DEFAULT_PAGE_SIZE : pageSize;
  pageSize = pageSize > MAX_PAGE_SIZE ? MAX_PAGE_SIZE : pageSize;

  const conditions = {};
  const docs = await Upload.find(conditions).sort({ updatedAt: -1 }).paginate(page, pageSize);
  const total = await Upload.count(conditions);

  res.jsonp({ dataList: docs, total, page, pageSize });
});

module.exports = router;
