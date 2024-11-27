const { existsSync } = require('fs');
const { join, basename } = require('path');
const config = require('@blocklet/sdk/lib/config');
const { getResources } = require('@blocklet/sdk/lib/component');
const httpProxy = require('http-proxy');
const joinUrl = require('url-join');
const { setPDFDownloadHeader } = require('../utils');

const proxy = httpProxy.createProxyServer();

const logger = console;

const ImgResourceType = 'imgpack';
const ImageBinDid = 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9';

let skipRunningCheck = false;
let mediaKitInfo = null as any;

// can change by initStaticResourceMiddleware resourceTypes
let resourceTypes = [
  {
    type: ImgResourceType,
    did: ImageBinDid,
    folder: '', // default is root, can be set to 'public' or 'assets' or any other folder
  },
];

let canUseResources = [] as any;

export const mappingResource = async () => {
  mediaKitInfo = config.components.find((item: any) => item.did === ImageBinDid);

  if (mediaKitInfo) {
    mediaKitInfo.uploadsDir = config.env.dataDir.replace(/\/[^/]*$/, '/image-bin/uploads');
  }

  try {
    const resources = getResources({
      types: resourceTypes,
      skipRunningCheck,
    });

    canUseResources = resources
      .map((resource: { path: string }) => {
        // check dir is exists and not in resourceKeys
        const originDir = resource.path;
        const resourceType = resourceTypes.find(({ type }) => originDir.endsWith(type));
        if (!existsSync(originDir) || !resourceType) {
          return false;
        }

        const { folder = '' } = resourceType;
        return { originDir, dir: join(originDir, folder || ''), blockletInfo: resource };
      })
      .filter(Boolean);

    logger.info(
      'Mapping can use resources count: ',
      canUseResources.length
      // canUseResources
    );

    return canUseResources;
  } catch (error) {
    console.error(error);
  }

  return false;
};

// events listen
const { events, Events } = config;
events.on(Events.componentAdded, () => mappingResource());
events.on(Events.componentRemoved, () => mappingResource());
events.on(Events.componentStarted, () => mappingResource());
events.on(Events.componentStopped, () => mappingResource());
events.on(Events.componentUpdated, () => mappingResource());

type initStaticResourceMiddlewareOptions = {
  options?: any;
  resourceTypes?: string[] | Object[];
  express: any;
  skipRunningCheck?: boolean;
};

export const initStaticResourceMiddleware = (
  {
    options,
    resourceTypes: _resourceTypes = resourceTypes,
    express,
    skipRunningCheck: _skipRunningCheck,
  } = {} as initStaticResourceMiddlewareOptions
) => {
  // save to global
  skipRunningCheck = !!_skipRunningCheck;

  if (_resourceTypes?.length > 0) {
    resourceTypes = _resourceTypes.map((item: any) => {
      if (typeof item === 'string') {
        return {
          type: item,
          did: ImageBinDid, // not set did, default is ImageBinDid
          folder: '', // not set folder, default is root
        };
      }
      return item;
    });
  }

  // init mapping resource
  mappingResource();

  return (req: any, res: any, next: Function) => {
    const urlPath = new URL(`http://localhost${req.url}`).pathname;
    const matchCanUseResourceItem = canUseResources.find((item: any) => existsSync(join(item.dir, urlPath)));
    // dynamic get can use resources assets
    if (matchCanUseResourceItem) {
      express.static(matchCanUseResourceItem.dir, {
        maxAge: '365d',
        immutable: true,
        index: false,
        // fallthrough: false,
        ...options,
      })(req, res, next);
    } else {
      res.status(404).end();
    }
  };
};

export const getCanUseResources = () => canUseResources;

export const initProxyToMediaKitUploadsMiddleware = ({ options, express } = {} as any) => {
  return (req: any, res: any, next: Function) => {
    if (!mediaKitInfo?.webEndpoint) {
      return next();
    }

    // Rewrite the URL to point to media kit /uploads/
    // eg. https://did-domain/image-bin/uploads2/123.png -> http://127.0.0.1:3000/uploads/123.png
    const filename = basename(req.url);
    req.url = joinUrl('/uploads/', filename);

    // set pdf download header if it's a pdf
    setPDFDownloadHeader(req, res);

    // Proxy requests to mediaKit's webEndpoint
    proxy.web(
      req,
      res,
      {
        target: mediaKitInfo.webEndpoint,
        changeOrigin: true,
        ...options,
      },
      (err: any) => {
        console.error('Proxy error:', err);
        res.status(502).end();
      }
    );
  };
};
