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
const Upload = require('./states/upload');
const { name, version } = require('../package.json');
const logger = require('./libs/logger');
const env = require('./libs/env');
const resources = require('./routes/resources');

if (fs.existsSync(env.uploadDir) === false) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const app = express();

app.set('trust proxy', true);
app.use(cookieParser());
app.use((() => express.json({ limit: config.env.preferences.maxUploadSize || Infinity }))());
app.use((() => express.urlencoded({ extended: true, limit: config.env.preferences.maxUploadSize || Infinity }))());

app.use(
  '/uploads',
  async (req, res, next) => {
    // fix missing ext
    const urlPath = req.url;
    if (!path.extname(urlPath)) {
      try {
        const item = await Upload.findOne({
          // replace / with empty string
          filename: path.basename(urlPath),
        });

        if (item?.mimetype) {
          res.setHeader('Content-Type', item.mimetype);
        }
      } catch (error) {
        // ignore error
      }
    }

    // add filename to response header
    try {
      const { filename } = req.query;
      if (filename) {
        res.attachment(filename);
      }
    } catch (error) {
      // ignore error
    }
    next();
  },
  express.static(env.uploadDir, { maxAge: '356d', immutable: true, index: false }),
  resources.staticResourceMiddleware
);

const router = express.Router();
router.use('/api/embed', require('./routes/embed'));

router.use('/api', resources.router);
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
