import { app as companionAppLib } from '@uppy/companion';
import bodyParser from 'body-parser';
import session from 'express-session';
import crypto from 'crypto';
// import { checkTrustedReferer, proxyImageDownload } from '../utils';

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
