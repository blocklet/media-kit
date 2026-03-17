import { drizzle } from 'drizzle-orm/d1';
import { eq, and, lt } from 'drizzle-orm';
import type { Env } from '../types';
import { uploadSessions } from '../db/schema';

/**
 * Clean up expired upload sessions.
 *
 * Called from the scheduled cron handler (every hour).
 * - Queries D1 for active sessions past their expires_at time
 * - For multipart: aborts via R2 binding
 * - For single-file: deletes temp R2 object
 * - Updates status to 'aborted'
 */
export async function cleanupExpiredSessions(env: Env): Promise<void> {
  const db = drizzle(env.DB);
  const now = new Date().toISOString();

  // Find all active sessions that have expired
  const expired = await db
    .select()
    .from(uploadSessions)
    .where(
      and(
        eq(uploadSessions.status, 'active'),
        lt(uploadSessions.expiresAt, now),
      ),
    );

  if (expired.length === 0) return;

  for (const session of expired) {
    if (session.uploadId && session.key) {
      // Multipart session — abort via R2 binding
      try {
        const multipart = env.R2_UPLOADS.resumeMultipartUpload(session.key, session.uploadId);
        await multipart.abort();
      } catch {
        // Ignore errors — upload might already be cleaned up or completed
      }
    } else if (session.key && session.key.startsWith('tmp/')) {
      // Single-file session — delete the temp R2 object
      try {
        await env.R2_UPLOADS.delete(session.key);
      } catch {
        // Ignore errors — object might already be deleted
      }
    }

    // Mark session as aborted in D1
    await db
      .update(uploadSessions)
      .set({ status: 'aborted' })
      .where(eq(uploadSessions.id, session.id));
  }
}
