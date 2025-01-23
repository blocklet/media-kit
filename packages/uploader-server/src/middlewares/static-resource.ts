const { existsSync } = require('fs');
const { join, basename } = require('path');
const config = require('@blocklet/sdk/lib/config');
const { getResources } = require('@blocklet/sdk/lib/component');
const joinUrl = require('url-join');
const component = require('@blocklet/sdk/lib/component');
const { setPDFDownloadHeader } = require('../utils');
const { ImageBinDid } = require('../constants');

const logger = console;

const ImgResourceType = 'imgpack';

let skipRunningCheck = false;

type ResourceType = {
  type: string;
  did: string;
  folder: string | string[];
  whitelist?: string[]; // 允许访问的文件扩展名
  blacklist?: string[]; // 禁止访问的文件扩展名
};

let resourceTypes: ResourceType[] = [
  {
    type: ImgResourceType,
    did: ImageBinDid,
    folder: '', // can be string or string[]
  },
];

let canUseResources = [] as any;

export const mappingResource = async () => {
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

        const folders = Array.isArray(resourceType.folder) ? resourceType.folder : [resourceType.folder || ''];

        return folders.map((folder) => ({
          originDir,
          dir: join(originDir, folder),
          blockletInfo: resource,
          whitelist: resourceType.whitelist,
          blacklist: resourceType.blacklist,
        }));
      })
      .filter(Boolean)
      .flat();

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
    const fileName = basename(req.url);

    const matchCanUseResourceItem = canUseResources.find((item: any) => {
      // 防止路径遍历攻击
      const normalizedPath = join(item.dir, fileName);
      if (!normalizedPath.startsWith(item.dir)) {
        return false;
      }

      // 检查文件是否存在
      if (!existsSync(normalizedPath)) {
        return false;
      }

      // 检查黑白名单
      const { whitelist, blacklist } = item;
      if (whitelist?.length && !whitelist.some((ext: string) => fileName.endsWith(ext))) {
        return false;
      }
      if (blacklist?.length && blacklist.some((ext: string) => fileName.endsWith(ext))) {
        return false;
      }

      return true;
    });

    if (matchCanUseResourceItem) {
      express.static(matchCanUseResourceItem.dir, {
        maxAge: '365d',
        immutable: true,
        index: false,
        ...options,
      })(req, res, next);
    } else {
      next();
    }
  };
};

export const getCanUseResources = () => canUseResources;

export const initProxyToMediaKitUploadsMiddleware = ({ options, express } = {} as any) => {
  return async (req: any, res: any, next: Function) => {
    if (!component.getComponentWebEndpoint(ImageBinDid)) {
      return next();
    }

    setPDFDownloadHeader(req, res);

    try {
      const { data, status, headers } = await component.call({
        name: ImageBinDid,
        path: joinUrl('/uploads', basename(req.url)),
        responseType: 'stream',
        method: 'GET',
      });

      if (data && status >= 200 && status < 400) {
        // proxy headers
        Object.keys(headers).forEach((key) => {
          res.set(key, headers[key]);
        });

        data
          .on('error', (err: Error) => {
            next();
          })
          .pipe(res)
          .on('error', (err: Error) => {
            next();
          });
      } else {
        next();
      }
    } catch (error) {
      next();
    }
  };
};
