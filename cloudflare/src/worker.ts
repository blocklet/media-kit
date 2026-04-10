import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import type { HonoEnv, Env } from './types';
import { authMiddleware } from './middleware/auth';
import { uploadRoutes } from './routes/upload';
import { fileServingRoutes } from './routes/serve';
import { folderRoutes } from './routes/folders';
import { unsplashRoutes } from './routes/unsplash';
import { statusRoutes } from './routes/status';
import { cleanupExpiredSessions } from './routes/cleanup';

const app = new Hono<HonoEnv>();

// Prefix strip middleware — allows mounting at a sub-path (e.g. /media-kit/)
// When APP_PREFIX is set, requests to /media-kit/* are internally rewritten to /*
// and X-Mount-Prefix is set so __blocklet__.js and HTML rewriting work correctly.
app.use('*', async (c, next) => {
  // Already stripped by a previous pass — skip
  if (c.req.header('X-Prefix-Stripped')) return next();

  const prefix = c.env.APP_PREFIX;
  if (!prefix || prefix === '/') return next();

  const pfx = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const url = new URL(c.req.url);
  if (url.pathname.startsWith(pfx + '/') || url.pathname === pfx) {
    const newPath = url.pathname.slice(pfx.length) || '/';
    url.pathname = newPath;
    const newReq = new Request(url.toString(), c.req.raw);
    newReq.headers.set('X-Mount-Prefix', pfx + '/');
    newReq.headers.set('X-Prefix-Stripped', '1');
    return app.fetch(newReq, c.env);
  }

  return next();
});

// Root path redirect: logged in → /media-kit/admin, not logged in → login
// /.well-known/service/* is global (no prefix) — it's the auth service
app.get('/', async (c) => {
  const raw = c.env.APP_PREFIX || '/';
  const pfx = raw === '/' ? '' : raw.replace(/\/$/, '');
  const loginUrl = '/.well-known/service/login';
  const adminUrl = `${pfx}/admin`;

  const authService = c.env.AUTH_SERVICE;
  if (!authService || typeof authService.resolveIdentity !== 'function') {
    return c.redirect(loginUrl);
  }

  const cookieHeader = c.req.header('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)login_token=([^;]*)/);
  const jwt = match ? decodeURIComponent(match[1]) : null;
  if (!jwt) {
    return c.redirect(loginUrl);
  }

  try {
    const caller = await authService.resolveIdentity(jwt, null, c.env.APP_PID);
    if (caller) {
      return c.redirect(adminUrl);
    }
  } catch {}

  return c.redirect(loginUrl);
});

// Global middleware — CORS restricted to deployment origin
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      // Only allow same-origin — SPA is served from the same worker
      const self = new URL(c.req.url).origin;
      return origin === self ? origin : '';
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  })
);
// TODO: D1 write consistency — When Drizzle ORM adds support for D1's withSession API,
// wrap write-path requests with `c.env.DB.withSession("first-primary")` to ensure
// read-after-write consistency. Without this, D1 replicas may serve stale reads
// immediately after writes (e.g., confirm then list may miss the new upload).
app.use('*', async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set('db', db);
  return next();
});

// Auto-register instance in DID service on first request
let registeredInstanceDid: string | null = null;

async function ensureRegistered(env: Env): Promise<string> {
  if (registeredInstanceDid) return registeredInstanceDid;
  if (!env.AUTH_SERVICE || !env.APP_SK) {
    return env.APP_PID || '';
  }
  try {
    const result = await env.AUTH_SERVICE.registerApp({
      instanceDid: 'auto',
      appSk: env.APP_SK,
      appName: env.APP_NAME || 'Media Kit',
      appDescription: 'Media asset management',
    });
    registeredInstanceDid = result.instanceDid;
    console.log(`[media-kit] Registered as instance: ${registeredInstanceDid}`);
    return registeredInstanceDid;
  } catch (e: any) {
    console.error('[media-kit] registerApp failed:', e?.message || e);
    return env.APP_PID || '';
  }
}

// Resolve instance DID on every request (cached after first call)
app.use('*', async (c, next) => {
  const instanceDid = await ensureRegistered(c.env);
  if (instanceDid) {
    // Override APP_PID with the derived instance DID
    (c.env as any).APP_PID = instanceDid;
  }
  return next();
});

// DID Auth login/session routes — proxy to AUTH_SERVICE (blocklet-service)
const DID_AUTH_PROXY_PATHS = [
  '/api/did/login/',
  '/api/did/session',
  '/api/did/refreshSession',
  '/api/did/connect/',
  '/api/did/logout',
];

app.all('/api/did/*', async (c) => {
  const path = new URL(c.req.url).pathname;
  const shouldProxy = DID_AUTH_PROXY_PATHS.some((p) => path.startsWith(p) || path === p);
  if (!shouldProxy) {
    return c.json({ error: 'Not Found' }, 404);
  }
  if (!c.env.AUTH_SERVICE) {
    return c.json({ error: 'AUTH_SERVICE not configured' }, 503);
  }
  const url = new URL(c.req.url);
  url.pathname = `/.well-known/service${url.pathname}`;
  const req = new Request(url.toString(), c.req.raw);
  if (c.env.APP_PID) {
    req.headers.set('X-Instance-Did', c.env.APP_PID);
  }
  const resp = await c.env.AUTH_SERVICE.fetch(req);
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: new Headers(resp.headers) });
});

// Proxy all /.well-known/service/* to AUTH_SERVICE (login page, session API, admin, etc.)
app.all('/.well-known/service/*', async (c) => {
  if (!c.env.AUTH_SERVICE) {
    return c.json({ error: 'AUTH_SERVICE not configured' }, 503);
  }
  const req = new Request(c.req.url, c.req.raw);
  if (c.env.APP_PID) {
    req.headers.set('X-Instance-Did', c.env.APP_PID);
    req.headers.set('X-Arc-Domain', new URL(c.req.url).host);
  }
  const resp = await c.env.AUTH_SERVICE.fetch(req);
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: new Headers(resp.headers) });
});

// Media Kit component DID (used by uploader to detect media-kit)
const MEDIA_KIT_COMPONENT_DID = 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9';

// __blocklet__.js — app metadata for frontend SessionProvider
app.get('/__blocklet__.js', async (c) => {
  const isJson = new URL(c.req.url).searchParams.get('type') === 'json';
  const requestOrigin = new URL(c.req.url).origin;
  const mountPrefix = c.req.header('X-Mount-Prefix') || '/';
  const defaultPreferences = {
    extsInput: c.env.ALLOWED_FILE_TYPES || '.jpeg,.png,.gif,.svg,.webp,.bmp,.ico',
    maxUploadSize: c.env.MAX_UPLOAD_SIZE || '500MB',
    useAiImage: c.env.USE_AI_IMAGE === 'true',
  };
  const data: Record<string, unknown> = {
    appPid: c.env.APP_PID || '',
    appName: c.env.APP_NAME || 'Media Kit',
    appUrl: requestOrigin,
    prefix: mountPrefix,
    groupPrefix: mountPrefix,
    cloudflareWorker: true,
          inCFWorkers: true,
    componentId: MEDIA_KIT_COMPONENT_DID,
    preferences: defaultPreferences,
    componentMountPoints: [{
      title: 'Media Kit',
      name: 'image-bin',
      did: MEDIA_KIT_COMPONENT_DID,
      version: '1.0.0',
      status: 'running',
      mountPoint: mountPrefix,
    }],
  };

  // Merge auth service metadata (appPid, appUrl, DID, theme, etc.)
  if (c.env.AUTH_SERVICE) {
    try {
      const url = new URL(c.req.url);
      url.pathname = '/__blocklet__.js';
      url.searchParams.set('type', 'json');
      const blockletReq = new Request(url.toString(), c.req.raw);
      if (c.env.APP_PID) blockletReq.headers.set('X-Instance-Did', c.env.APP_PID);
      const resp = await c.env.AUTH_SERVICE.fetch(blockletReq);
      if (resp.ok) {
        const authData = (await resp.json()) as Record<string, unknown>;
        const authPreferences = authData.preferences as Record<string, unknown> | undefined;
        Object.assign(data, authData, {
          appName: c.env.APP_NAME || authData.appName || 'Media Kit',
          appUrl: requestOrigin,
          prefix: mountPrefix,
          groupPrefix: mountPrefix,
          cloudflareWorker: true,
          inCFWorkers: true,
          componentId: MEDIA_KIT_COMPONENT_DID,
          preferences: { ...defaultPreferences, ...authPreferences },
          // Ensure media-kit component is always present
          componentMountPoints: [
            ...((authData.componentMountPoints as any[]) || []),
            {
              title: 'Media Kit',
              name: 'image-bin',
              did: MEDIA_KIT_COMPONENT_DID,
              version: '1.0.0',
              status: 'running',
              mountPoint: mountPrefix,
            },
          ],
        });
      }
    } catch (e: any) {
      console.error('[__blocklet__.js] AUTH_SERVICE fetch error:', e?.message || e);
    }
  }

  if (isJson) {
    return c.json(data);
  }
  return c.text(`window.blocklet = ${JSON.stringify(data)};`, 200, {
    'Content-Type': 'application/javascript',
  });
});

// File serving (no auth required for public files, EXIF stripped)
app.route('/', fileServingRoutes);

// Status endpoint (no auth)
app.route('/api', statusRoutes);

// Auth-protected routes (via AUTH_SERVICE RPC)
app.use('/api/*', authMiddleware);
app.route('/api', uploadRoutes);
app.route('/api', folderRoutes);
app.route('/api', unsplashRoutes);

// AI Image — proxy to AIGNE Hub (same flow as original blocklet version)
const AIGNE_HUB_DID = 'z8ia3xzq2tMq8CRHfaXj1BTYJyYnEcHbqP8cJ';

let aigneHubMountPoint: string | null = null;

async function getAigneHubMountPoint(env: Env): Promise<string> {
  if (aigneHubMountPoint) return aigneHubMountPoint;
  const hubBase = env.AIGNE_HUB_URL || 'https://hub.aigne.io';
  const res = await fetch(`${hubBase}/__blocklet__.js?type=json`);
  if (!res.ok) throw new Error(`AIGNE Hub fetch failed: ${res.status}`);
  const blocklet: any = await res.json();
  const comp = (blocklet?.componentMountPoints || []).find((m: any) => m.did === AIGNE_HUB_DID);
  if (!comp) throw new Error('AIGNE Hub component not found');
  aigneHubMountPoint = `${hubBase}${comp.mountPoint}`;
  return aigneHubMountPoint;
}

app.get('/api/image/models', async (c) => {
  const hubUrl = await getAigneHubMountPoint(c.env);
  const apiKey = c.env.AIGNE_HUB_API_KEY || '';
  const res = await fetch(`${hubUrl}/api/ai/models?type=image`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const data = await res.json();
  return c.json(data, res.status as any);
});

app.post('/api/image/generations', async (c) => {
  const { prompt, number = 1, model = 'dall-e-2', ...rest } = await c.req.json();
  const hubUrl = await getAigneHubMountPoint(c.env);
  const res = await fetch(`${hubUrl}/api/v2/image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-did': c.get('user')?.id || '',
      Authorization: `Bearer ${c.env.AIGNE_HUB_API_KEY || ''}`,
    },
    body: JSON.stringify({
      input: {
        ...rest,
        prompt,
        n: parseInt(String(number), 10),
        modelOptions: { model },
        outputFileType: 'url',
      },
    }),
  });
  const data: any = await res.json();

  // Download hub images to R2 temp directory for fast local access
  // Avoids CORS + hub connection instability. Cleaned up by cron after 24h.
  if (data.images) {
    data.images = await Promise.all(
      data.images.map(async (img: any) => {
        if (!img.url) return img;
        try {
          const imgRes = await fetch(img.url);
          if (!imgRes.ok || !imgRes.body) return img;
          const ext = (img.url.split('.').pop()?.split('?')[0]) || 'png';
          const key = `tmp/ai/${crypto.randomUUID()}.${ext}`;
          await c.env.R2_UPLOADS.put(key, imgRes.body, {
            httpMetadata: { contentType: img.mimeType || 'image/png' },
          });
          return { ...img, url: `/uploads/${key}` };
        } catch {
          return img;
        }
      })
    );
  }

  return c.json(data, res.status as any);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// SPA fallback — non-API routes return index.html with prefix-aware asset rewriting
app.notFound(async (c) => {
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/api/') || path.startsWith('/health')) {
    return c.json({ error: 'Not Found' }, 404);
  }

  const assets = (c.env as any).ASSETS;
  if (!assets) {
    return c.json({ error: 'Not Found' }, 404);
  }

  // Rewrite HTML for mount prefix support + inject __blocklet__.js
  const rewriteHtml = async (htmlResponse: Response) => {
    if (!htmlResponse.headers.get('content-type')?.includes('text/html')) return htmlResponse;
    let html = await htmlResponse.text();
    const mountPrefix = c.req.header('X-Mount-Prefix');
    if (mountPrefix && mountPrefix !== '/') {
      const pfx = mountPrefix.endsWith('/') ? mountPrefix.slice(0, -1) : mountPrefix;
      // Rewrite all absolute asset/src paths in HTML attributes
      html = html.replace(/((?:src|href)=["'])\/(assets|src)\//g, `$1${pfx}/$2/`);
      // Rewrite __blocklet__.js script tag
      html = html.replace(/(<script[^>]*src=["'])\/__blocklet__\.js(["'])/g, `$1${pfx}/__blocklet__.js$2`);
    }
    return new Response(html, {
      status: htmlResponse.status,
      headers: { ...Object.fromEntries(htmlResponse.headers.entries()), 'Cache-Control': 'no-cache' },
    });
  };

  try {
    // Try exact asset first
    const assetResponse = await assets.fetch(c.req.raw);
    if (assetResponse.status !== 404) {
      if (assetResponse.headers.get('content-type')?.includes('text/html')) {
        return rewriteHtml(assetResponse);
      }
      return assetResponse;
    }
  } catch {}

  // Fall back to index.html for SPA routing
  try {
    const url = new URL(c.req.url);
    url.pathname = '/index.html';
    const htmlResponse = await assets.fetch(new Request(url.toString(), c.req.raw));
    return rewriteHtml(htmlResponse);
  } catch {}

  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

export default {
  fetch: app.fetch,

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(cleanupExpiredSessions(env));
  },
};
