import { Hono } from 'hono';
import type { HonoEnv } from '../types';
import { uploads } from '../db/schema';

export const unsplashRoutes = new Hono<HonoEnv>();

/**
 * GET /unsplash/search — Search Unsplash photos.
 * Proxies to Unsplash API with Client-ID auth.
 * Returns structured results with attribution (ToS compliant).
 */
unsplashRoutes.get('/unsplash/search', async (c) => {
  const query = c.req.query('q');
  if (!query) {
    return c.json({ error: 'query parameter "q" is required' }, 400);
  }

  const page = c.req.query('page') || '1';
  const perPage = c.req.query('per_page') || '30';

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Client-ID ${c.env.UNSPLASH_KEY}`,
      },
    },
  );

  if (!res.ok) {
    return c.json({ error: 'Unsplash API request failed' }, res.status as 400);
  }

  const data = (await res.json()) as {
    results: Array<{
      id: string;
      urls: Record<string, string>;
      user: { name: string; username: string; links: { html: string } };
      links: { download_location: string };
      width: number;
      height: number;
      description: string | null;
      alt_description: string | null;
    }>;
    total: number;
    total_pages: number;
  };

  return c.json({
    results: data.results.map((photo) => ({
      id: photo.id,
      urls: photo.urls,
      attribution: {
        name: photo.user.name,
        username: photo.user.username,
        link: photo.user.links.html,
      },
      download_location: photo.links.download_location,
      width: photo.width,
      height: photo.height,
      description: photo.description || photo.alt_description,
    })),
    total: data.total,
    total_pages: data.total_pages,
  });
});

/**
 * POST /unsplash/track-download — Track download + save reference in D1.
 * Required by Unsplash API ToS: must trigger download tracking when user selects a photo.
 * Saves a reference record in the uploads table with `unsplash:{photoId}` as filename
 * (not an actual R2 key — images are hotlinked, not re-hosted).
 */
unsplashRoutes.post('/unsplash/track-download', async (c) => {
  const body = await c.req.json<{
    downloadLocation: string;
    photoId: string;
    attribution: { name: string; username: string; link: string };
  }>();

  const { downloadLocation, photoId, attribution } = body;

  if (!downloadLocation || !photoId || !attribution) {
    return c.json({ error: 'downloadLocation, photoId, and attribution are required' }, 400);
  }

  // Required by Unsplash API: trigger download tracking
  await fetch(downloadLocation, {
    headers: {
      Authorization: `Client-ID ${c.env.UNSPLASH_KEY}`,
    },
  });

  // Save reference in D1 (NOT the image file — hotlink only)
  const db = c.get('db');
  const user = c.get('user');
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await db.insert(uploads).values({
    id,
    filename: `unsplash:${photoId}`, // special prefix, not an R2 key
    originalname: `${attribution.name} via Unsplash`,
    mimetype: 'image/jpeg',
    size: 0, // not stored locally
    folderId: c.req.header('x-folder-id') || null,
    remark: JSON.stringify({ unsplash: true, attribution, photoId }),
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    updatedBy: user.id,
  });

  return c.json({ id, photoId });
});
