require('dotenv-flow').config();
require('express-async-errors');

const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
// const companion = require('@uppy/companion');
const fallback = require('@blocklet/sdk/lib/middlewares/fallback');
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
app.use(express.json({ limit: env.maxUploadSize }));
app.use(express.urlencoded({ extended: true, limit: env.maxUploadSize }));

app.use(
  '/uploads',
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
