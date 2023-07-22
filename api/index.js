require('dotenv-flow').config();
require('express-async-errors');

const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const fallback = require('@blocklet/sdk/lib/middlewares/fallback');

const { name, version } = require('../package.json');
const { any2webp } = require('./libs/image');
const logger = require('./libs/logger');
const env = require('./libs/env');

if (fs.existsSync(env.uploadDir) === false) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const app = express();

app.set('trust proxy', true);
app.use(cookieParser());
app.use(express.json({ limit: env.maxUploadSize }));
app.use(express.urlencoded({ extended: true, limit: env.maxUploadSize }));

// Convert images to webp on the fly
// eslint-disable-next-line consistent-return
app.use('/uploads/:filename.webp', (req, res, next) => {
  const filePath = `${req.params.filename}.webp`;
  const sourcePath = path.join(env.uploadDir, req.params.filename);

  // requesting the source file
  if (filePath.endsWith('.webp') === false) {
    return next();
  }

  // already converted?
  const destPath = path.join(env.uploadDir, filePath);
  if (fs.existsSync(destPath)) {
    return next();
  }

  if (fs.existsSync(sourcePath)) {
    // source already webp?
    if (sourcePath.endsWith('.webp')) {
      return res.sendFile(sourcePath, { maxAge: '356d', immutable: true });
    }

    // cannot convert to webp
    if (['.png', '.jpg', '.jpeg'].some((ext) => sourcePath.endsWith(ext)) === false) {
      return res.sendFile(sourcePath, { maxAge: '356d', immutable: true });
    }
  }

  // do the convert
  any2webp(sourcePath, destPath)
    .then(() => {
      logger.info(`Converted ${sourcePath} to webp`);
      next();
    })
    .catch((err) => {
      console.error(`Failed to convert ${sourcePath} to webp`, err);
      res.sendFile(sourcePath, { maxAge: '356d', immutable: true });
    });
});

app.use('/uploads', express.static(env.uploadDir, { maxAge: '356d', immutable: true, index: false }));

const router = express.Router();
router.use('/api/embed', require('./routes/embed'));
router.use('/api', require('./routes/upload'));

const isProduction = process.env.NODE_ENV === 'production' || process.env.ABT_NODE_SERVICE_ENV === 'production';
app.use(cors());
app.use(router);

if (isProduction) {
  app.use(compression());
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
