// const express = require("express");
const companion = require('@uppy/companion');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios');
const crypto = require('crypto');

const secret = crypto.randomBytes(32).toString('hex');

export function initCompanion({
  path,
  express,
  providerOptions,
  ...restProps
}: {
  path: string;
  express: Function;
  providerOptions?: Object;
}) {
  const app = express();

  // Companion requires body-parser and express-session middleware.
  // You can add it like this if you use those throughout your app.
  //
  // If you are using something else inour app, you can add these
  // middlewares in the same subpath as Companion instead.

  app.use(bodyParser.json());
  app.use(session({ secret }));

  app.use('/proxy', proxyImageDownload);

  let dynamicProviderOptions = providerOptions;

  const companionOptions = {
    secret,
    providerOptions, // unused
    server: {
      protocol: 'https',
      host: 'UNUSED_HOST', // unused
      path: 'UNUSED_PATH', // unused
    },
    filePath: path,
    streamingUpload: true,
    metrics: false,
    ...restProps,
  };

  const newCompanion = companion.app(companionOptions);

  const { app: companionApp } = newCompanion;

  app.all(
    '*',
    (req: any, res: any, next: Function) => {
      // hacker the req companion
      let hackerCompanion = {} as any;

      Object.defineProperty(req, 'companion', {
        get() {
          return hackerCompanion;
        },
        set(value) {
          hackerCompanion = value;
          // set middleware providerOptions to dynamicProviderOptions
          hackerCompanion.options.providerOptions = dynamicProviderOptions;
        },
      });

      next();
    },
    companionApp
  );

  newCompanion.handle = app;

  // only set provider options
  newCompanion.setProviderOptions = (options: Object) => {
    dynamicProviderOptions = options;
  };

  return newCompanion;
}

export async function proxyImageDownload(req: any, res: any, next?: Function) {
  let { url, responseType = 'stream' } = {
    ...req.query,
    ...req.body,
  } as {
    url: string;
    responseType: string;
  };

  if (url) {
    // fix chinese url bug
    url = encodeURI(url);
    try {
      const { headers, data, status } = await axios.get(url, {
        responseType,
      });

      if (data && status >= 200 && status < 302) {
        res.setHeader('Content-Type', headers['content-type']);
        try {
        } catch (error) {}
        if (responseType === 'stream') {
          data.pipe(res);
        } else if (responseType === 'arraybuffer') {
          res.end(data?.toString?.('binary'), 'binary'); // format to binary
        } else {
          res.send(data);
        }
      } else {
        throw new Error('download image error');
      }
    } catch (err) {
      console.error('Proxy url failed: ', err);
      res.status(500).send('Proxy url failed');
    }
  } else {
    res.status(500).send('Parameter "url" is required');
  }
}
