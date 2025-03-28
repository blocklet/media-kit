import { existsSync } from 'fs';
import { join, basename } from 'path';
import config from '@blocklet/sdk/lib/config';
import { getResources } from '@blocklet/sdk/lib/component';
import joinUrl from 'url-join';
import component from '@blocklet/sdk/lib/component';
import {
  setPDFDownloadHeader,
  logger,
  ResourceFile,
  calculateCacheControl,
  serveResource,
  scanDirectory,
  getFileNameFromReq,
} from '../utils';
import { ImageBinDid } from '../constants';

const ImgResourceType = 'imgpack';

let skipRunningCheck = false;

type ResourceType = {
  type: string;
  did: string;
  folder: string | string[];
  whitelist?: string[]; // 允许访问的文件扩展名
  blacklist?: string[]; // 禁止访问的文件扩展名
  setHeaders?: (res: any, filePath: string, statObj: any) => void;
  immutable?: boolean;
  maxAge?: string;
};

let resourceTypes: ResourceType[] = [
  {
    type: ImgResourceType,
    did: ImageBinDid,
    folder: '', // can be string or string[]
  },
];

// 资源映射表
let resourcesMap = new Map<string, ResourceFile>();

export const mappingResource = async () => {
  try {
    const resources = getResources({
      types: resourceTypes,
      skipRunningCheck,
    });

    let canUseResources = [] as any;

    canUseResources = resources
      .map((resource: any) => {
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

    // 构建资源映射表
    resourcesMap.clear();

    // 使用新的扫描目录函数
    for (const resource of canUseResources) {
      const { dir, whitelist, blacklist, originDir, blockletInfo } = resource;

      if (existsSync(dir)) {
        try {
          const dirResourceMap = scanDirectory(dir, {
            whitelist,
            blacklist,
            originDir,
            blockletInfo,
          });

          // 合并资源映射
          for (const [key, value] of dirResourceMap.entries()) {
            resourcesMap.set(key, value);
          }
        } catch (err) {
          logger.error(`Error scanning directory ${dir}:`, err);
        }
      }
    }

    logger.info('Mapping resources: files count:', resourcesMap.size, 'directories count:', canUseResources.length);

    return canUseResources;
  } catch (error) {
    logger.error(error);
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
    options = {},
    resourceTypes: _resourceTypes = resourceTypes,
    express,
    skipRunningCheck: _skipRunningCheck,
  } = {} as initStaticResourceMiddlewareOptions
) => {
  // save to global
  skipRunningCheck = !!_skipRunningCheck;

  // 使用公共缓存控制计算函数
  const { cacheControl, cacheControlImmutable } = calculateCacheControl(
    options.maxAge || '365d',
    options.immutable !== false
  );

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
    // get file name from path without query params
    const fileName = getFileNameFromReq(req);

    try {
      // 直接从映射表中查找资源
      const resource = resourcesMap.get(fileName);

      if (resource) {
        // 使用公共服务资源函数
        serveResource(req, res, next, resource, {
          ...options,
          cacheControl,
          cacheControlImmutable,
        });
      } else {
        next();
      }
    } catch (error) {
      logger.error('Error serving static file:', error);
      next();
    }
  };
};

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
