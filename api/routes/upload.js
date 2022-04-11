const multer = require('multer');
const express = require('express');
const joinUrl = require('url-join');
const middleware = require('@blocklet/sdk/lib/middlewares');
const mime = require('mime-types');
const { nanoid } = require('nanoid');

const env = require('../libs/env');

const router = express.Router();

const auth = middleware.auth({ roles: ['owner', 'admin'] });
const upload = multer({
  storage: multer.diskStorage({
    destination: env.uploadDir,
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${nanoid()}.${mime.extension(file.mimetype)}`);
    },
  }),
});

router.use('/upload', auth, upload.single('image'), (req, res) => {
  // req.file is object of `image` files
  // req.body will contain the text fields, if there were any
  const obj = new URL(env.appUrl);
  obj.protocol = req.get('x-forwarded-proto') || req.protocol;
  obj.pathname = joinUrl('/uploads', req.file.filename);
  res.json({ url: obj.href });

  // TODO: create database records on this
});

module.exports = router;
