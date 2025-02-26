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
      res.status(500).send('Proxy url failed');
    }
  } else {
    res.status(500).send('Parameter "url" is required');
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
