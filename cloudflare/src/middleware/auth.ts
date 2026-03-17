import { Context, Next } from 'hono';
import type { HonoEnv } from '../types';

const DEFAULT_DID = 'did:abt:default-uploader';

/**
 * Auth middleware.
 *
 * TODO: replace with shijun's CF auth SDK.
 * When auth is ready, upload flow should go through Worker (not presigned URL direct upload)
 * to ensure every request is authenticated.
 */
export async function authMiddleware(c: Context<HonoEnv>, next: Next) {
  const userId = c.req.header('x-user-did') || DEFAULT_DID;
  const adminDids = (c.env.ADMIN_DIDS || DEFAULT_DID).split(',').map((s) => s.trim());
  const isAdmin = adminDids.includes(userId);

  c.set('user', {
    id: userId,
    role: isAdmin ? 'admin' : 'member',
  });

  return next();
}

export async function isAdminMiddleware(c: Context<HonoEnv>, next: Next) {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  return next();
}
