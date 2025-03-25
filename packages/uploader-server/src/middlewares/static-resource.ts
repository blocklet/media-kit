import { existsSync, readdirSync, statSync, createReadStream } from 'fs';
import { join, basename, extname } from 'path';
import config from '@blocklet/sdk/lib/config';
import { getResources } from '@blocklet/sdk/lib/component';
import joinUrl from 'url-join';
import component from '@blocklet/sdk/lib/component';
import mime from 'mime-types';
import { setPDFDownloadHeader, logger } from '../utils';
import { ImageBinDid } from '../constants';
import ms from 'ms';

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

type ResourceFile = {
  filePath: string;
  dir: string;
  originDir: string;
  blockletInfo: any;
  whitelist?: string[];
  blacklist?: string[];
  mtime: Date;
  size: number;
  contentType: string;
};

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
    for (const resource of canUseResources) {
      const { dir, whitelist, blacklist, originDir, blockletInfo } = resource;

      if (existsSync(dir)) {
        try {
          const files = readdirSync(dir);
          for (const file of files) {
            const filePath = join(dir, file);

            let stat;
            try {
              stat = statSync(filePath);
              if (stat.isDirectory()) continue;
            } catch (e) {
              continue;
            }

            // 检查白名单和黑名单
            if (whitelist?.length && !whitelist.some((ext: string) => file.endsWith(ext))) {
              continue;
            }
            if (blacklist?.length && blacklist.some((ext: string) => file.endsWith(ext))) {
              continue;
            }

            // 获取文件信息
            const contentType = mime.lookup(filePath) || 'application/octet-stream';

            // 添加到映射表
            resourcesMap.set(file, {
              filePath,
              dir,
              originDir,
              blockletInfo,
              whitelist,
              blacklist,
              mtime: stat.mtime,
              size: stat.size,
              contentType,
            });
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

  // 预先计算maxAge的值
  let maxAgeInSeconds: number = 31536000; // 默认1年
  const maxAge = options.maxAge || '365d';

  if (typeof maxAge === 'string') {
    try {
      const milliseconds = ms(maxAge as any);
      maxAgeInSeconds = typeof milliseconds === 'number' ? milliseconds / 1000 : 31536000;
    } catch (e) {
      logger.warn(`Invalid maxAge format: ${maxAge}, using default 1 year (31536000 seconds)`);
    }
  } else {
    maxAgeInSeconds = maxAge;
  }

  const cacheControl = `public, max-age=${maxAgeInSeconds}`;
  const cacheControlImmutable = `${cacheControl}, immutable`;

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
    const fileName = basename(req.path || req.url?.split('?')[0]);

    try {
      // 直接从映射表中查找资源
      const resource = resourcesMap.get(fileName);

      if (resource) {
        // 设置响应头
        res.setHeader('Content-Type', resource.contentType);
        res.setHeader('Content-Length', resource.size);
        res.setHeader('Last-Modified', resource.mtime.toUTCString());

        // 使用预先计算好的缓存控制值
        res.setHeader('Cache-Control', options.immutable === false ? cacheControl : cacheControlImmutable);

        // 自定义headers
        if (options.setHeaders && typeof options.setHeaders === 'function') {
          const statObj = { mtime: resource.mtime, size: resource.size };
          options.setHeaders(res, resource.filePath, statObj);
        }

        // 处理条件请求 (If-Modified-Since)
        const ifModifiedSince = req.headers['if-modified-since'];
        if (ifModifiedSince) {
          const ifModifiedSinceDate = new Date(ifModifiedSince);
          if (resource.mtime <= ifModifiedSinceDate) {
            res.statusCode = 304;
            res.end();
            return;
          }
        }

        // 流式传输文件
        const fileStream = createReadStream(resource.filePath);
        fileStream.on('error', (error) => {
          logger.error(`Error streaming file ${resource.filePath}:`, error);
          next(error);
        });

        fileStream.pipe(res);
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
