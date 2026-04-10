import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import type { HonoEnv } from '../types';
import { isAdminMiddleware } from '../middleware/auth';
import { folders } from '../db/schema';

export const folderRoutes = new Hono<HonoEnv>();

/**
 * POST /folders — Create a folder (admin only).
 * If a folder with the same name already exists, return the existing one.
 */
folderRoutes.post('/folders', isAdminMiddleware, async (c) => {
  const db = c.get('db');
  const user = c.get('user');
  const body = await c.req.json<{ name: string }>();

  if (!body.name) {
    return c.json({ error: 'Folder name is required' }, 400);
  }

  // Check if folder already exists
  const [existing] = await db
    .select()
    .from(folders)
    .where(eq(folders.name, body.name))
    .limit(1);

  if (existing) {
    return c.json({
      _id: existing.id,
      name: existing.name,
      createdAt: existing.createdAt || '',
      updatedAt: existing.updatedAt || '',
      createdBy: existing.createdBy || '',
      updatedBy: existing.updatedBy || '',
    });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(folders).values({
    id,
    name: body.name,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    updatedBy: user.id,
  });

  return c.json({
    _id: id,
    name: body.name,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    updatedBy: user.id,
  });
});

/**
 * GET /folders — List all folders.
 */
folderRoutes.get('/folders', async (c) => {
  const db = c.get('db');
  const rows = await db.select().from(folders).orderBy(desc(folders.createdAt));

  return c.json(rows.map((row) => ({
    _id: row.id,
    name: row.name,
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',
    createdBy: row.createdBy || '',
    updatedBy: row.updatedBy || '',
  })));
});
