import { Hono } from 'hono';
import type { HonoEnv } from '../types';

export const fileServingRoutes = new Hono<HonoEnv>();

/**
 * GET /uploads/:filename — Serve files from R2.
 *
 * Production: images go through cf.image for EXIF stripping + resize.
 * Local dev: serve directly from R2 binding (no cf.image).
 */
fileServingRoutes.get('/uploads/*', async (c) => {
  const filename = c.req.path.replace('/uploads/', '');
  const w = c.req.query('w');
  const h = c.req.query('h');
  const downloadName = c.req.query('filename');

  const isProduction = c.env.ENVIRONMENT === 'production' && c.env.R2_ORIGIN_DOMAIN;

  const object = await c.env.R2_UPLOADS.head(filename);
  if (!object) {
    return c.text('404 NOT FOUND', 404);
  }

  const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
  const isImage = contentType.startsWith('image/');

  // Production: use cf.image for EXIF stripping + auto format + resize
  if (isImage && isProduction) {
    const r2OriginUrl = `https://${c.env.R2_ORIGIN_DOMAIN}/${filename}`;

    const imageOptions: Record<string, unknown> = {
      metadata: 'none',
      format: 'auto',
    };

    if (w) imageOptions.width = parseInt(w, 10);
    if (h) imageOptions.height = parseInt(h, 10);

    if (w || h) {
      imageOptions.fit = 'contain';
      imageOptions.quality = 85;
    } else {
      imageOptions.quality = 100;
    }

    return fetch(r2OriginUrl, {
      cf: { image: imageOptions },
    } as RequestInit);
  }

  // Local dev / non-image: serve directly from R2 binding
  const r2Object = await c.env.R2_UPLOADS.get(filename);
  if (!r2Object) {
    return c.text('404 NOT FOUND', 404);
  }

  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  };

  if (downloadName) {
    headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(downloadName)}"`;
  }

  return new Response(r2Object.body, { headers });
});
