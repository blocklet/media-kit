import axios from 'axios';
import config from '@blocklet/sdk/lib/config';
import path from 'path';
import joinUrl from 'url-join';
// @ts-ignore
import AuthService from '@blocklet/sdk/service/auth';

const authClient = new AuthService();

// Cache interface to store domain and timestamp
interface DomainsCache {
  timestamp: number;
  domains: string[];
}

// Cache duration in milliseconds
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

// simple LRU cache to record the trustedDomains with timestamp
const trustedDomainsCache: DomainsCache = {
  timestamp: 0,
  domains: [],
};

export async function getTrustedDomainsCache({
  forceUpdate = false,
  ttl = DEFAULT_TTL,
}: { forceUpdate?: boolean; ttl?: number } = {}) {
  //  @FIXME: use sdk to get trustedDomains
  // check if the getTrustedDomains can be called
  //   if (typeof authClient.getTrustedDomains !== 'function') {
  //     return null;
  //   }

  const now = Date.now();

  // Check if cache exists and is not expired
  if (!forceUpdate && trustedDomainsCache.domains.length > 0) {
    if (now - trustedDomainsCache.timestamp < ttl) {
      return trustedDomainsCache.domains;
    }
  }

  // Update cache
  // @FIXME: use sdk to get trustedDomains
  // trustedDomainsCache.domains = await authClient.getTrustedDomains();
  trustedDomainsCache.domains = await axios
    .get(joinUrl(config.env.appUrl, '/.well-known/service/api/federated/getTrustedDomains'))
    .then((res) => res.data);
  trustedDomainsCache.timestamp = now;

  return trustedDomainsCache.domains;
}

export async function checkTrustedReferer(req: any, res: any, next?: Function) {
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
      console.error('Proxy url failed: ', err);
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
