import axios from 'axios';
import path from 'path';
import joinUrl from 'url-join';
import { isbot } from 'isbot';
import component from '@blocklet/sdk/lib/component';
import { ImageBinDid } from './constants';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import { getSignData } from '@blocklet/sdk/lib/util/verify-sign';
import FormData from 'form-data';
import type { Method } from 'axios';
import omit from 'lodash/omit';
import ms from 'ms';
import mime from 'mime-types';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export let logger = console;

// it means we are running in blocklet environment, use logger from @blocklet/logger
if (process.env.BLOCKLET_LOG_DIR) {
  try {
    const initLogger = require('@blocklet/logger');
    logger = initLogger('uploader-server');
    logger.info('uploader-server logger init success');
  } catch (error) {
    // ignore
  }
}

// fork from @blocklet/sdk/lib/component/index.d.ts
type CallComponentOptions<D = any, P = any> = {
  name?: string;
  method?: Method;
  path: string;
  data?: D;
  params?: P;
  headers?: {
    [key: string]: any;
  };
};

// Cache interface to store domain and timestamp
interface DomainsCache {
  timestamp: number;
  domains: string[];
}

// Cache duration in milliseconds
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const appUrl = process.env.BLOCKLET_APP_URL || '';

// simple LRU cache to record the trustedDomains with timestamp
const trustedDomainsCache: DomainsCache = {
  timestamp: 0,
  domains: [],
};

export async function getTrustedDomainsCache({
  forceUpdate = false,
  ttl = DEFAULT_TTL,
}: { forceUpdate?: boolean; ttl?: number } = {}) {
  if (!appUrl) {
    return [];
  }

  const now = Date.now();

  // Check if cache exists and is not expired
  if (!forceUpdate && trustedDomainsCache.domains.length > 0) {
    if (now - trustedDomainsCache.timestamp < ttl) {
      return trustedDomainsCache.domains;
    }
  }

  trustedDomainsCache.domains = await axios
    .get(joinUrl(appUrl, '/.well-known/service/api/federated/getTrustedDomains'))
    .then((res) => res.data);
  trustedDomainsCache.timestamp = now;

  return trustedDomainsCache.domains;
}

export async function checkTrustedReferer(req: any, res: any, next?: Function) {
  // Allow OpenGraph crawlers by checking user agent, and allow login user
  if (isbot(req.get('user-agent'))) {
    return next?.();
  }

  // Check referer
  const referer = req.headers.referer;
  if (!referer) {
    return res.status(403).send('Access denied');
  }

  // Verify it's from your domain
  const allowedDomains = await getTrustedDomainsCache();
  const refererHost = new URL(referer).hostname;
  if (allowedDomains?.length && !allowedDomains.some((domain) => refererHost.includes(domain))) {
    return res.status(403).send('Access denied');
  }

  next?.();
}

export async function proxyImageDownload(req: any, res: any, next?: Function) {
  let { url } = {
    ...req.query,
    ...req.body,
  } as {
    url: string;
  };

  if (url) {
    // fix chinese url bug
    url = encodeURI(url);
    try {
      const { headers, data, status } = await axios({
        method: 'get',
        url,
        responseType: 'stream',
        timeout: 30 * 1000,
        headers: {
          // Add common headers to mimic browser request
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      if (data && status >= 200 && status < 302) {
        // Forward the content type header
        res.setHeader('Content-Type', headers['content-type']);

        // Pipe the response stream directly to our response
        data.pipe(res);
      } else {
        throw new Error('download image error');
      }
    } catch (err) {
      logger.error('Proxy url failed: ', err);
      res.status(400).send('Proxy url failed');
    }
  } else {
    res.status(400).send('Parameter "url" is required');
  }
}

// only trigger when it's a pdf
export function setPDFDownloadHeader(req: any, res: any) {
  if (path.extname(req.path) === '.pdf') {
    const filename = req.query?.filename ?? req?.path;
    // set pdf download
    res.setHeader('Content-Disposition', `attachment; ${filename ? `filename="${filename}"` : ''}`);
  }
}

export const getFileHash = async (filePath: string, maxBytes = 5 * 1024 * 1024) => {
  const hash = crypto.createHash('md5');
  const readStream = createReadStream(filePath, {
    start: 0,
    end: maxBytes - 1,
    highWaterMark: 1024 * 1024, // 1MB chunks
  });

  for await (const chunk of readStream) {
    hash.update(chunk.toString());
  }

  return hash.digest('hex');
};

export async function uploadToMediaKit({
  filePath,
  fileName,
  base64,
  extraComponentCallOptions,
}: {
  filePath?: string;
  fileName?: string;
  base64?: string;
  extraComponentCallOptions?: CallComponentOptions;
}) {
  if (!filePath && !base64) {
    throw new Error('filePath or base64 is required');
  }

  if (base64) {
    if (!fileName) {
      throw new Error('fileName is required when base64 is provided');
    }
    const res = await component.call({
      name: ImageBinDid,
      path: '/api/sdk/uploads',
      data: {
        base64,
        filename: fileName,
      },
      ...omit(extraComponentCallOptions, ['name', 'path', 'data']),
    });

    return res;
  }

  if (filePath) {
    const fileStream = createReadStream(filePath);
    const filename = fileName || path.basename(filePath);
    const form = new FormData();
    const fileHash = await getFileHash(filePath);

    form.append('file', fileStream as any);
    form.append('filename', filename);
    form.append('hash', fileHash);

    const res = await component.call(
      {
        name: ImageBinDid,
        path: '/api/sdk/uploads',
        data: form,
        headers: {
          'x-component-upload-sig': getSignData({
            data: {
              filename,
              hash: fileHash,
            },
            method: 'POST',
            url: '/api/sdk/uploads',
            params: extraComponentCallOptions?.params || {},
          }).sig,
          ...extraComponentCallOptions?.headers,
        },
        ...omit(extraComponentCallOptions, ['name', 'path', 'data', 'headers']),
      },
      {
        retries: 0,
      }
    );

    return res;
  }
}

export async function getMediaKitFileStream(filePath: string) {
  const fileName = path.basename(filePath);

  const res = await component.call({
    name: ImageBinDid,
    path: joinUrl('/uploads', fileName),
    responseType: 'stream',
    method: 'GET',
  });

  return res;
}

// ============= 资源处理通用函数 =============

// 资源文件类型定义
export type ResourceFile = {
  filePath: string; // 文件的完整路径
  dir: string; // 文件所在目录
  originDir: string; // 原始目录
  blockletInfo: any; // 组件信息
  whitelist?: string[]; // 白名单
  blacklist?: string[]; // 黑名单
  mtime: Date; // 修改时间
  size: number; // 文件大小
  contentType: string; // 内容类型
};

// 计算缓存控制头
export function calculateCacheControl(maxAge: string | number = '365d', immutable: boolean = true) {
  let maxAgeInSeconds: number = 31536000; // 默认1年

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

  return {
    cacheControl,
    cacheControlImmutable,
    maxAgeInSeconds,
  };
}

// 服务文件资源
export function serveResource(req: any, res: any, next: Function, resource: ResourceFile, options: any = {}) {
  try {
    // 设置响应头
    res.setHeader('Content-Type', resource.contentType);
    res.setHeader('Content-Length', resource.size);
    res.setHeader('Last-Modified', resource.mtime.toUTCString());

    // 缓存控制
    const { cacheControl, cacheControlImmutable } = calculateCacheControl(
      options.maxAge || '365d',
      options.immutable !== false
    );
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
  } catch (error) {
    logger.error('Error serving static file:', error);
    next(error);
  }
}

// 扫描目录并创建资源映射
export function scanDirectory(
  directory: string,
  options: {
    whitelist?: string[];
    blacklist?: string[];
    originDir?: string;
    blockletInfo?: any;
  } = {}
): Map<string, ResourceFile> {
  const resourceMap = new Map<string, ResourceFile>();

  if (!existsSync(directory)) {
    return resourceMap;
  }

  try {
    const files = readdirSync(directory);
    for (const file of files) {
      const filePath = join(directory, file);

      let stat;
      try {
        stat = statSync(filePath);
        if (stat.isDirectory()) continue;
      } catch (e) {
        continue;
      }

      // 检查白名单和黑名单
      if (options.whitelist?.length && !options.whitelist.some((ext: string) => file.endsWith(ext))) {
        continue;
      }
      if (options.blacklist?.length && options.blacklist.some((ext: string) => file.endsWith(ext))) {
        continue;
      }

      // 获取文件信息
      const contentType = mime.lookup(filePath) || 'application/octet-stream';

      // 添加到映射表
      resourceMap.set(file, {
        filePath,
        dir: directory,
        originDir: options.originDir || directory,
        blockletInfo: options.blockletInfo || {},
        whitelist: options.whitelist,
        blacklist: options.blacklist,
        mtime: stat.mtime,
        size: stat.size,
        contentType,
      });
    }
  } catch (err) {
    logger.error(`Error scanning directory ${directory}:`, err);
  }

  return resourceMap;
}

export function getFileNameFromReq(req: any) {
  const pathname = req.path || req.url?.split('?')[0];
  // 解码 URL 中的中文和特殊字符
  return path.basename(decodeURIComponent(pathname || ''));
}
