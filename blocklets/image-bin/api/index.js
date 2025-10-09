require('dotenv-flow').config();
require('express-async-errors');

const fs = require('fs');
const path = require('path');
const cors = require('cors');
const express = require('express');
const cookieParser = require('cookie-parser');
// const companion = require('@uppy/companion');
const fallback = require('@blocklet/sdk/lib/middlewares/fallback');
const {
  initProxyToMediaKitUploadsMiddleware,
  // initDynamicResourceMiddleware
  // HACK: 是可以 resolve 到的，eslint 却会报错，所以暂时禁用
  // eslint-disable-next-line import/no-unresolved
} = require('@blocklet/uploader-server');
const config = require('@blocklet/sdk/lib/config');
const { xss } = require('@blocklet/xss');
const { csrf, cdn } = require('@blocklet/sdk/lib/middlewares');
const initLogger = require('@blocklet/logger');
// HACK: 是可以 resolve 到的，eslint 却会报错，所以暂时禁用
// eslint-disable-next-line import/no-unresolved
const { setPDFDownloadHeader, checkTrustedReferer } = require('@blocklet/uploader-server');
const { Upload } = require('./store');
const { name, version } = require('../package.json');
const logger = require('./libs/logger');
const env = require('./libs/env');
const resources = require('./routes/resources');

const isProduction = process.env.NODE_ENV === 'production' || process.env.ABT_NODE_SERVICE_ENV === 'production';

if (fs.existsSync(env.uploadDir) === false) {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

if (fs.existsSync(env.uploadTempDir) === false) {
  fs.mkdirSync(env.uploadTempDir, { recursive: true });
}

const app = express();

initLogger.setupAccessLogger(app);

app.set('trust proxy', true);
app.use(cookieParser());
app.use((req, res, next) => {
  return express.json({ limit: config.env.preferences.maxUploadSize || Infinity })(req, res, next);
});
app.use((req, res, next) => {
  return express.urlencoded({ extended: true, limit: config.env.preferences.maxUploadSize || Infinity })(
    req,
    res,
    next
  );
});
app.use(xss());
app.use(csrf());
app.use(cdn());

app.use(
  '/uploads',
  (req, res, next) => {
    if (config.env.preferences?.checkReferer) {
      checkTrustedReferer(req, res, next);
      return;
    }
    next();
  },
  async (req, res, next) => {
    // fix missing ext
    const urlPath = req.url;
    if (!path.extname(urlPath)) {
      try {
        const item = await Upload.findOne({
          where: {
            // replace / with empty string
            filename: path.basename(urlPath),
          },
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
      } else {
        // set pdf download header if it's a pdf
        setPDFDownloadHeader(req, res);
      }
    } catch (error) {
      // ignore error
    }

    next();
  },
  express.static(env.uploadDir, { maxAge: '356d', immutable: true, index: false }),
  resources.staticResourceMiddleware,
  (req, res) => {
    res.status(404).send('404 NOT FOUND');
  }
);

app.use(
  '/proxy-to-uploads',
  // initDynamicResourceMiddleware({
  //   componentDid: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9',
  //   resourcePaths: [
  //     {
  //       path: `${config.env.dataDir}/*`,
  //     },
  //   ],
  // }),
  initProxyToMediaKitUploadsMiddleware({
    express,
  }),
  (req, res) => {
    res.status(404).send('404 NOT FOUND BY PROXY');
  }
);

const router = express.Router();

router.use('/api', resources.router);
router.use('/api', require('./routes/upload'));

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
    res.status(400).send('Something broke!');
  });
}

const port = parseInt(process.env.BLOCKLET_PORT, 10) || 3030;

app.listen(port, (err) => {
  if (err) throw err;
  logger.info(`> ${name} v${version} ready on ${port}`);
});

module.exports = { app };
