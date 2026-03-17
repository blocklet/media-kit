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

// Global middleware
// TODO: restrict CORS origin to actual deployment domain when auth is implemented
app.use('*', cors());
// TODO: D1 write consistency — When Drizzle ORM adds support for D1's withSession API,
// wrap write-path requests with `c.env.DB.withSession("first-primary")` to ensure
// read-after-write consistency. Without this, D1 replicas may serve stale reads
// immediately after writes (e.g., confirm then list may miss the new upload).
app.use('*', async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set('db', db);
  return next();
});

// File serving (no auth required for public files, EXIF stripped)
app.route('/', fileServingRoutes);

// Status endpoint (no auth)
app.route('/api', statusRoutes);

// Auth-protected routes
// TODO: replace x-user-did header auth with shijun's CF auth SDK when ready
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

  // Rewrite hub image URLs to go through our proxy (avoids CORS/connection issues)
  if (data.images) {
    data.images = data.images.map((img: any) => {
      if (img.url) {
        // /api/image/proxy?url=<encoded-hub-url>
        img.url = `/api/image/proxy?url=${encodeURIComponent(img.url)}`;
      }
      return img;
    });
  }

  return c.json(data, res.status as any);
});

// GET /api/image/proxy — Proxy AIGNE Hub generated images
app.get('/api/image/proxy', async (c) => {
  const url = c.req.query('url');
  if (!url) return c.json({ error: 'url required' }, 400);

  // Only allow proxying from AIGNE Hub
  const hubBase = c.env.AIGNE_HUB_URL || 'https://hub.aigne.io';
  if (!url.startsWith(hubBase)) {
    return c.json({ error: 'Invalid URL' }, 403);
  }

  const res = await fetch(url, {
    cf: { cacheTtl: 0 },  // Don't use CF cache for hub images (they may be temporary)
  } as RequestInit);
  if (!res.ok) return c.json({ error: `Upstream error: ${res.status}` }, res.status as any);

  return new Response(res.body, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/png',
      'Cache-Control': 'no-cache',  // AI generated images should not be cached by browser
    },
  });
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', version: '1.0.0' }));

// SPA fallback — non-API routes return index.html for client-side routing
app.notFound(async (c) => {
  const path = new URL(c.req.url).pathname;
  if (path.startsWith('/api/') || path.startsWith('/health')) {
    return c.json({ error: 'Not Found' }, 404);
  }
  try {
    const assets = (c.env as any).ASSETS;
    if (assets) {
      return assets.fetch(new Request(new URL('/', c.req.url)));
    }
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
