require('dotenv-flow').config();
require('express-async-errors');

const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const fallback = require('express-history-api-fallback');

const { name, version } = require('../package.json');
const logger = require('./libs/logger');
const env = require('./libs/env');

if (fs.existsSync(env.uploadDir) === false) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const app = express();

app.set('trust proxy', true);
app.use(cookieParser());
// TODO: make max size configuration
app.use(express.json({ limit: '1 mb' }));
app.use(express.urlencoded({ extended: true, limit: '1 mb' }));

app.use('/uploads', express.static(env.uploadDir));

const router = express.Router();
router.use('/api', require('./routes/user'));
router.use('/api', require('./routes/upload'));

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production' || process.env.ABT_NODE_SERVICE_ENV === 'production';

if (isDevelopment) {
  process.env.BLOCKLET_PORT = 3030;
}

if (isProduction) {
  app.use(cors());
  app.use(compression());

  const staticDir = path.resolve(__dirname, '../', 'build');
  app.use(express.static(staticDir, { index: 'index.html' }));
  app.use(router);
  app.use(fallback('index.html', { root: staticDir }));

  app.use((req, res) => {
    res.status(404).send('404 NOT FOUND');
  });
  app.use((err, req, res) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
  });
} else {
  app.use(router);
}

const port = parseInt(process.env.BLOCKLET_PORT, 10) || 3030;

app.listen(port, (err) => {
  if (err) throw err;
  logger.info(`> ${name} v${version} ready on ${port}`);
});
