require('dotenv-flow').config();
require('express-async-errors');

const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
// const companion = require('@uppy/companion');
const fallback = require('@blocklet/sdk/lib/middlewares/fallback');
const config = require('@blocklet/sdk/lib/config');
const { initStaticResourceMiddleware } = require('@blocklet/uploader/middlewares');
const { name, version } = require('../package.json');
const logger = require('./libs/logger');
const env = require('./libs/env');
const { mediaTypes } = require('./libs/constants');

if (fs.existsSync(env.uploadDir) === false) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const app = express();

app.set('trust proxy', true);
app.use(cookieParser());
app.use(express.json({ limit: env.maxUploadSize }));
app.use(express.urlencoded({ extended: true, limit: env.maxUploadSize }));

const getBucketPath = (componentDid) => {
  for (const component of config.components || []) {
    if (component.did === componentDid) {
      const resource = component.resources?.find((x) => mediaTypes.some((type) => x.endsWith(type)));
      if (resource) {
        return resource;
      }
    }
  }
  return null;
};

app.use('/uploads/resources/:componentDid/:filename', (req, res) => {
  const { componentDid, filename } = req.params;
  if (!filename) {
    res.status(404).send('filename is required');
    return;
  }

  const bucketPath = getBucketPath(componentDid);
  if (!bucketPath) {
    res.status(404).send('Bucket Not Found');
    return;
  }
  const file = path.join(bucketPath, filename);
  if (!fs.existsSync(file)) {
    res.status(404).send('File Not Found');
    return;
  }
  res.sendFile(file);
});

app.use(
  '/uploads',
  express.static(env.uploadDir, { maxAge: '356d', immutable: true, index: false }),
  initStaticResourceMiddleware({
    express,
    resourceKeys: [
      'export.imgpack',
      // {
      //   key: 'export.page',
      //   folder: 'pages',
      // },
    ],
  })
);

const router = express.Router();
router.use('/api/embed', require('./routes/embed'));
router.use('/api', require('./routes/upload'));

const isProduction = process.env.NODE_ENV === 'production' || process.env.ABT_NODE_SERVICE_ENV === 'production';
app.use(cors());
app.use(router);

if (isProduction) {
  const staticDir = path.resolve(process.env.BLOCKLET_APP_DIR, 'dist');
  app.use(express.static(staticDir, { maxAge: '365d', index: false }));
  app.use(fallback('index.html', { root: staticDir, maxAge: 0 }));

  app.use((req, res) => {
    res.status(404).send('404 NOT FOUND');
  });
  app.use((err, req, res) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
  });
}

const port = parseInt(process.env.BLOCKLET_PORT, 10) || 3030;

app.listen(port, (err) => {
  if (err) throw err;
  logger.info(`> ${name} v${version} ready on ${port}`);
});

module.exports = { app };
