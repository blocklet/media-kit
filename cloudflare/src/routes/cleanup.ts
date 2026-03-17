import { drizzle } from 'drizzle-orm/d1';
import { eq, and, lt } from 'drizzle-orm';
import type { Env } from '../types';
import { uploadSessions } from '../db/schema';
import { createS3Client, s3AbortMultipartUpload } from '../utils/s3';

/**
 * Clean up expired upload sessions.
 *
 * Called from the scheduled cron handler (every hour).
 * - Queries D1 for active sessions past their expires_at time
 * - For each: aborts the multipart upload via S3 API, updates status to 'aborted'
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

  const s3 = createS3Client(env);

  for (const session of expired) {
    // Attempt to abort the multipart upload in R2 via S3 API
    if (session.uploadId && session.key) {
      try {
        await s3AbortMultipartUpload(s3, env, session.key, session.uploadId);
      } catch {
        // Ignore errors — upload might already be cleaned up or completed
      }
    }

    // Mark session as aborted in D1
    await db
      .update(uploadSessions)
      .set({ status: 'aborted' })
      .where(eq(uploadSessions.id, session.id));
  }
}
