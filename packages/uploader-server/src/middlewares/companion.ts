import { app as companionAppLib } from '@uppy/companion';
import bodyParser from 'body-parser';
import session from 'express-session';
import crypto from 'crypto';
// import { checkTrustedReferer, proxyImageDownload } from '../utils';

const secret = crypto.randomBytes(32).toString('hex');

const REWRITE_500_STATUS_CODE = 400;

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

  // FIXME：prevent SSRF attack
  // app.use('/proxy', checkTrustedReferer, proxyImageDownload);

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

  const newCompanion = companionAppLib(companionOptions);

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

      // Start: Add response status code rewriting logic
      const originalStatus = res.status.bind(res);
      const originalSendStatus = res.sendStatus.bind(res);
      const originalWriteHead = res.writeHead.bind(res);

      // Override res.status
      res.status = (code: number) => {
        if (code >= 500) {
          return originalStatus(REWRITE_500_STATUS_CODE);
        }
        return originalStatus(code);
      };

      // Override res.sendStatus
      res.sendStatus = (code: number) => {
        if (code >= 500) {
          return originalSendStatus(REWRITE_500_STATUS_CODE);
        }
        return originalSendStatus(code);
      };

      // Override res.writeHead
      res.writeHead = (statusCode: number, ...args: any[]) => {
        if (res.headersSent) {
          // If headers are already sent, call original and let it handle (likely error or no-op)
          return originalWriteHead(statusCode, ...args);
        }
        const newStatusCode = statusCode >= 500 ? REWRITE_500_STATUS_CODE : statusCode;
        return originalWriteHead(newStatusCode, ...args);
      };

      // Override res.statusCode property
      // Initialize with the current value (usually 200 by default if not set)
      let _statusCode = res.statusCode;
      Object.defineProperty(res, 'statusCode', {
        configurable: true, // Allow further redefinition if necessary
        enumerable: true,
        get() {
          return _statusCode;
        },
        set(code: number) {
          if (code >= 500) {
            _statusCode = REWRITE_500_STATUS_CODE;
          } else {
            _statusCode = code;
          }
        },
      });
      // End: Add response status code rewriting logic

      next();
    },
    companionApp
  );

  // @ts-ignore
  newCompanion.handle = app;

  // @ts-ignore only set provider options
  newCompanion.setProviderOptions = (options: Object) => {
    dynamicProviderOptions = options;
  };

  return newCompanion;
}
