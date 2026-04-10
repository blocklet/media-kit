import { Hono } from 'hono';
import { eq, and, like, desc, sql, inArray } from 'drizzle-orm';
import type { HonoEnv, CheckResponse, PresignResponse, ConfirmResponse } from '../types';
import { uploads, uploadTags, uploadSessions, folders } from '../db/schema';
import {
  createS3Client,
  generatePresignedPutUrl,
  s3ListParts,
} from '../utils/s3';
import { streamMD5, detectMimeType, sanitizeSvg } from '../utils/hash';
import { isAdminMiddleware } from '../middleware/auth';

const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
const DEFAULT_PART_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_PART_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PARTS = 10000;
const SESSION_EXPIRY_HOURS = 24;
function parseSize(size: string): number {
  const match = size.match(/^(\d+)\s*(MB|GB|KB)?$/i);
  if (!match) return 500 * 1024 * 1024;
  const num = parseInt(match[1], 10);
  const unit = (match[2] || 'MB').toUpperCase();
  if (unit === 'GB') return num * 1024 * 1024 * 1024;
  if (unit === 'KB') return num * 1024;
  return num * 1024 * 1024;
}

export const uploadRoutes = new Hono<HonoEnv>();

// POST /uploads/check — Dedup check by size+ext
uploadRoutes.post('/uploads/check', async (c) => {
  const { size, ext } = await c.req.json<{ size: number; ext: string }>();
  if (!size || !ext) {
    return c.json({ exists: false } satisfies CheckResponse);
  }

  const db = c.get('db');
  const cleanExt = ext.replace(/^\./, '');
  const matches = await db
    .select()
    .from(uploads)
    .where(and(eq(uploads.size, size), like(uploads.filename, `%.${cleanExt}`)));

  if (matches.length === 1) {
    const match = matches[0];
    return c.json({
      exists: true,
      url: `/uploads/${match.filename}`,
      filename: match.filename,
      uploadId: match.id,
    } satisfies CheckResponse);
  }

  return c.json({ exists: false } satisfies CheckResponse);
});

// POST /uploads/presign — Generate presigned URL or create multipart session
uploadRoutes.post('/uploads/presign', async (c) => {
  const { originalname, mimetype, size, ext, folderId } = await c.req.json<{
    originalname: string;
    mimetype?: string;
    size: number;
    ext: string;
    folderId?: string;
  }>();

  const db = c.get('db');
  const user = c.get('user');
  const s3 = createS3Client(c.env);
  const cleanExt = ext.replace(/^\./, '');
  const sessionId = crypto.randomUUID();
  const tempKey = `tmp/${crypto.randomUUID()}.${cleanExt}`;
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  const isMultipart = size >= MULTIPART_THRESHOLD;

  if (isMultipart) {
    const multipartUpload = await c.env.R2_UPLOADS.createMultipartUpload(tempKey, {
      httpMetadata: mimetype ? { contentType: mimetype } : undefined,
    });
    const uploadId = multipartUpload.uploadId;

    let partSize = DEFAULT_PART_SIZE;
    let partCount = Math.ceil(size / partSize);
    if (partCount > MAX_PARTS) {
      partSize = Math.ceil(size / MAX_PARTS);
      if (partSize < MIN_PART_SIZE) partSize = MIN_PART_SIZE;
      partCount = Math.ceil(size / partSize);
    }

    await db.insert(uploadSessions).values({
      id: sessionId,
      uploadId,
      key: tempKey,
      totalSize: size,
      partSize,
      status: 'active',
      createdBy: user.id,
      createdAt: now,
      expiresAt,
    });

    return c.json({
      sessionId,
      multipart: true,
      uploadId,
      key: tempKey,
      partSize,
      partCount,
    } satisfies PresignResponse);
  }

  await db.insert(uploadSessions).values({
    id: sessionId,
    key: tempKey,
    totalSize: size,
    status: 'active',
    createdBy: user.id,
    createdAt: now,
    expiresAt,
  });

  // In dev mode, return a proxy URL through the worker (avoids CORS with remote R2)
  const isDev = c.env.ENVIRONMENT === 'development';
  let presignedUrl: string;

  if (isDev) {
    presignedUrl = `/api/uploads/proxy-put/${sessionId}`;
  } else {
    presignedUrl = await generatePresignedPutUrl(s3, c.env, tempKey, {
      contentType: mimetype,
    });
  }

  return c.json({
    sessionId,
    presignedUrl,
  } satisfies PresignResponse);
});

// POST /uploads/confirm — Finalize upload
uploadRoutes.post('/uploads/confirm', async (c) => {
  const body = await c.req.json<{
    sessionId?: string;
    existingUploadId?: string;
    originalname?: string;
    mimetype?: string;
    folderId?: string;
    tags?: string;
  }>();

  const db = c.get('db');
  const user = c.get('user');

  // Dedup shortcut: clone existing record for current user
  if (body.existingUploadId) {
    const [existing] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, body.existingUploadId))
      .limit(1);

    if (!existing) {
      return c.json({ error: 'Upload not found' }, 404);
    }

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.insert(uploads).values({
      id: newId,
      filename: existing.filename,
      originalname: body.originalname || existing.originalname,
      mimetype: existing.mimetype,
      size: existing.size,
      folderId: body.folderId || existing.folderId,
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
      updatedBy: user.id,
    });

    if (body.tags) {
      const tagList = body.tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        await db.insert(uploadTags).values(tagList.map((tag) => ({ uploadId: newId, tag })));
      }
    }

    // Fetch tags for the new record
    const tags = await db
      .select({ tag: uploadTags.tag })
      .from(uploadTags)
      .where(eq(uploadTags.uploadId, newId));

    return c.json({
      _id: newId,
      filename: existing.filename,
      originalname: body.originalname || existing.originalname || '',
      mimetype: existing.mimetype || '',
      size: existing.size || 0,
      url: `/uploads/${existing.filename}`,
      createdAt: now,
      createdBy: user.id,
      tags: tags.map((t) => t.tag),
    } satisfies ConfirmResponse);
  }

  // Normal confirm flow
  if (!body.sessionId) {
    return c.json({ error: 'sessionId or existingUploadId required' }, 400);
  }

  const [session] = await db
    .select()
    .from(uploadSessions)
    .where(eq(uploadSessions.id, body.sessionId))
    .limit(1);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  if (session.status !== 'active') {
    return c.json({ error: 'Session is not active' }, 400);
  }

  // Reject files exceeding MAX_UPLOAD_SIZE (would need Queue for async hash processing)
  const maxSize = parseSize(c.env.MAX_UPLOAD_SIZE || '500MB');
  if (session.totalSize && session.totalSize > maxSize) {
    return c.json({ error: `File size exceeds limit (${c.env.MAX_UPLOAD_SIZE || '500MB'})` }, 400);
  }

  // Range-read first 4KB for MIME detection (separate from full body)
  const rangeObj = await c.env.R2_UPLOADS.get(session.key, { range: { offset: 0, length: 4096 } });
  if (!rangeObj) {
    return c.json({ error: 'Temp file not found in R2' }, 404);
  }
  const headerBytes = new Uint8Array(await rangeObj.arrayBuffer());
  const detectedMime = detectMimeType(headerBytes);

  if (body.mimetype && detectedMime && !areMimeTypesCompatible(detectedMime, body.mimetype)) {
    await c.env.R2_UPLOADS.delete(session.key);
    await db.update(uploadSessions).set({ status: 'aborted' }).where(eq(uploadSessions.id, body.sessionId));
    return c.json({ error: 'File content does not match claimed MIME type' }, 400);
  }

  const finalMime = detectedMime || body.mimetype || 'application/octet-stream';

  // SVG sanitization — needs full object read
  if (finalMime === 'image/svg+xml') {
    const svgObj = await c.env.R2_UPLOADS.get(session.key);
    if (svgObj) {
      const svgText = await svgObj.text();
      const sanitized = sanitizeSvg(svgText);
      if (sanitized !== svgText) {
        await c.env.R2_UPLOADS.put(session.key, sanitized);
      }
    }
  }

  // Streaming MD5 hash — always get a fresh stream
  const hashObj = await c.env.R2_UPLOADS.get(session.key);
  if (!hashObj) {
    return c.json({ error: 'Failed to read file for hashing' }, 500);
  }

  const md5Hash = await streamMD5(hashObj.body);
  const fileSize = session.totalSize || hashObj.size;
  const ext = session.key.split('.').pop() || '';
  const finalKey = `${md5Hash}.${ext}`;

  // Check if final key already exists (content dedup by MD5)
  const existingObject = await c.env.R2_UPLOADS.head(finalKey);
  if (existingObject) {
    // MD5-based key match means content is identical, just delete temp
    await c.env.R2_UPLOADS.delete(session.key);
  } else {
    // Use R2 binding for copy (works in local dev with miniflare)
    const srcObj = await c.env.R2_UPLOADS.get(session.key);
    if (srcObj) {
      await c.env.R2_UPLOADS.put(finalKey, srcObj.body, {
        httpMetadata: srcObj.httpMetadata,
      });
    }
    await c.env.R2_UPLOADS.delete(session.key);
  }

  // Insert D1 record
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(uploads).values({
    id: newId,
    filename: finalKey,
    originalname: body.originalname || finalKey,
    mimetype: finalMime,
    size: fileSize,
    folderId: body.folderId,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    updatedBy: user.id,
  });

  if (body.tags) {
    const tagList = body.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      await db.insert(uploadTags).values(tagList.map((tag) => ({ uploadId: newId, tag })));
    }
  }

  await db
    .update(uploadSessions)
    .set({ status: 'completed', finalKey })
    .where(eq(uploadSessions.id, body.sessionId));

  // Fetch tags for response
  const responseTags = body.tags
    ? body.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return c.json({
    _id: newId,
    filename: finalKey,
    originalname: body.originalname || finalKey,
    mimetype: finalMime,
    size: fileSize,
    url: `/uploads/${finalKey}`,
    createdAt: now,
    createdBy: user.id,
    tags: responseTags,
  } satisfies ConfirmResponse);
});

// POST /uploads/multipart/part-url — Get presigned URL for a single part
uploadRoutes.post('/uploads/multipart/part-url', async (c) => {
  const { sessionId, partNumber } = await c.req.json<{ sessionId: string; partNumber: number }>();
  const db = c.get('db');

  const [session] = await db
    .select()
    .from(uploadSessions)
    .where(eq(uploadSessions.id, sessionId))
    .limit(1);

  if (!session || session.status !== 'active') {
    return c.json({ error: 'Session not found or not active' }, 400);
  }

  if (!session.uploadId) {
    return c.json({ error: 'Session is not a multipart upload' }, 400);
  }

  const s3 = createS3Client(c.env);
  const presignedUrl = await generatePresignedPutUrl(s3, c.env, session.key, {
    partNumber,
    uploadId: session.uploadId,
  });

  return c.json({ presignedUrl, partNumber });
});

// POST /uploads/multipart/complete — Complete multipart upload
uploadRoutes.post('/uploads/multipart/complete', async (c) => {
  const { sessionId, parts } = await c.req.json<{
    sessionId: string;
    parts: Array<{ partNumber: number; etag: string }>;
  }>();
  const db = c.get('db');

  const [session] = await db
    .select()
    .from(uploadSessions)
    .where(eq(uploadSessions.id, sessionId))
    .limit(1);

  if (!session || session.status !== 'active') {
    return c.json({ error: 'Session not found or not active' }, 400);
  }

  if (!session.uploadId) {
    return c.json({ error: 'Session is not a multipart upload' }, 400);
  }

  const multipart = c.env.R2_UPLOADS.resumeMultipartUpload(session.key, session.uploadId);
  await multipart.complete(parts.map(p => ({ partNumber: p.partNumber, etag: p.etag })));

  return c.json({ status: 'assembled' });
});

// POST /uploads/multipart/abort — Abort multipart upload
uploadRoutes.post('/uploads/multipart/abort', async (c) => {
  const { sessionId } = await c.req.json<{ sessionId: string }>();
  const db = c.get('db');

  const [session] = await db
    .select()
    .from(uploadSessions)
    .where(eq(uploadSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  if (session.uploadId) {
    const multipart = c.env.R2_UPLOADS.resumeMultipartUpload(session.key, session.uploadId);
    await multipart.abort();
  }

  await db
    .update(uploadSessions)
    .set({ status: 'aborted' })
    .where(eq(uploadSessions.id, sessionId));

  return c.json({ status: 'aborted' });
});

// GET /uploads/multipart/status — Query completed parts
uploadRoutes.get('/uploads/multipart/status', async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ error: 'sessionId required' }, 400);
  }

  const db = c.get('db');
  const [session] = await db
    .select()
    .from(uploadSessions)
    .where(eq(uploadSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return c.json({ error: 'Session not found' }, 404);
  }

  if (!session.uploadId) {
    return c.json({ completedParts: [], status: session.status });
  }

  const s3 = createS3Client(c.env);
  const completedParts = await s3ListParts(s3, c.env, session.key, session.uploadId);

  return c.json({ completedParts, status: session.status });
});

// PUT /uploads/proxy-put/:sessionId — Dev-mode proxy: receive file body and put to local R2
uploadRoutes.put('/uploads/proxy-put/:sessionId', async (c) => {
  const db = c.get('db');
  const sessionId = c.req.param('sessionId');

  const [session] = await db
    .select()
    .from(uploadSessions)
    .where(eq(uploadSessions.id, sessionId))
    .limit(1);

  if (!session || session.status !== 'active') {
    return c.json({ error: 'Session not found or not active' }, 400);
  }

  const body = c.req.raw.body;
  const contentType = c.req.header('content-type') || 'application/octet-stream';

  await c.env.R2_UPLOADS.put(session.key, body, {
    httpMetadata: { contentType },
  });

  return new Response(null, { status: 200 });
});

// POST /uploads/direct — Direct upload through Worker (for local dev or small files)
uploadRoutes.post('/uploads/direct', async (c) => {
  const db = c.get('db');
  const user = c.get('user');

  const formData = await c.req.formData();
  const file = formData.get('file') as unknown as File | null;
  const folderId = (formData.get('folderId') as string) || '';
  const tags = (formData.get('tags') as string) || '';

  if (!file) {
    return c.json({ error: 'No file provided' }, 400);
  }

  const ext = file.name.split('.').pop() || 'bin';
  const tempKey = `tmp/${crypto.randomUUID()}.${ext}`;

  // Upload to R2 binding directly (works in local dev)
  await c.env.R2_UPLOADS.put(tempKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  // Read back for MD5 hash
  const obj = await c.env.R2_UPLOADS.get(tempKey);
  if (!obj) {
    return c.json({ error: 'Failed to read uploaded file' }, 500);
  }

  const md5Hash = await streamMD5(obj.body);
  const finalKey = `${md5Hash}.${ext}`;

  // Content dedup — use R2 binding directly (no S3 client needed)
  const existingObj = await c.env.R2_UPLOADS.head(finalKey);
  if (existingObj) {
    await c.env.R2_UPLOADS.delete(tempKey);
  } else {
    // Copy via R2 binding: get + put + delete temp
    const srcObj = await c.env.R2_UPLOADS.get(tempKey);
    if (srcObj) {
      await c.env.R2_UPLOADS.put(finalKey, srcObj.body, {
        httpMetadata: srcObj.httpMetadata,
      });
    }
    await c.env.R2_UPLOADS.delete(tempKey);
  }

  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(uploads).values({
    id: newId,
    filename: finalKey,
    originalname: file.name,
    mimetype: file.type || 'application/octet-stream',
    size: file.size,
    folderId: folderId || null,
    createdAt: now,
    updatedAt: now,
    createdBy: user.id,
    updatedBy: user.id,
  });

  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      await db.insert(uploadTags).values(tagList.map((tag) => ({ uploadId: newId, tag })));
    }
  }

  return c.json({
    _id: newId,
    filename: finalKey,
    originalname: file.name,
    mimetype: file.type || 'application/octet-stream',
    size: file.size,
    url: `/uploads/${finalKey}`,
    createdAt: now,
    createdBy: user.id,
    tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  });
});

// GET /uploads — List uploads with pagination (inline Drizzle query)
uploadRoutes.get('/uploads', async (c) => {
  const db = c.get('db');
  const user = c.get('user');

  const page = parseInt(c.req.query('page') || '1', 10);
  const pageSize = parseInt(c.req.query('pageSize') || '20', 10);
  const folderId = c.req.query('folderId');
  const tag = c.req.query('tag') || c.req.query('tags');
  const createdBy = c.req.query('createdBy');

  const conditions: ReturnType<typeof eq>[] = [];

  // Admin can see all uploads; members only see their own
  if (user.role === 'admin' && createdBy) {
    conditions.push(eq(uploads.createdBy, createdBy));
  } else if (user.role !== 'admin') {
    conditions.push(eq(uploads.createdBy, user.id));
  }

  if (folderId) {
    conditions.push(eq(uploads.folderId, folderId));
  }

  if (tag) {
    const taggedIds = db
      .select({ uploadId: uploadTags.uploadId })
      .from(uploadTags)
      .where(eq(uploadTags.tag, tag));
    conditions.push(inArray(uploads.id, taggedIds));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(uploads)
      .where(whereClause)
      .orderBy(desc(uploads.createdAt), desc(uploads.updatedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)` })
      .from(uploads)
      .where(whereClause),
  ]);

  // Fetch tags for all uploads in the result
  const uploadIds = data.map((u) => u.id);
  const allTags = uploadIds.length > 0
    ? await db.select().from(uploadTags).where(inArray(uploadTags.uploadId, uploadIds))
    : [];
  const tagsByUpload = new Map<string, string[]>();
  allTags.forEach((t) => {
    const list = tagsByUpload.get(t.uploadId) || [];
    list.push(t.tag);
    tagsByUpload.set(t.uploadId, list);
  });

  const rows = data.map((row) => ({
    _id: row.id,
    filename: row.filename,
    originalname: row.originalname || '',
    mimetype: row.mimetype || '',
    size: row.size || 0,
    remark: row.remark || '',
    folderId: row.folderId,
    tags: tagsByUpload.get(row.id) || [],
    url: `/uploads/${row.filename}`,
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',
    createdBy: row.createdBy || '',
    updatedBy: row.updatedBy || '',
  }));

  // Fetch folders for the response (matches original blocklet API format)
  const allFolders = await db.select().from(folders).orderBy(desc(folders.createdAt));
  const folderRows = allFolders.map((f: any) => ({
    _id: f.id,
    name: f.name,
    createdAt: f.createdAt || '',
    updatedAt: f.updatedAt || '',
    createdBy: f.createdBy || '',
    updatedBy: f.updatedBy || '',
  }));

  const total = countResult[0]?.count ?? 0;

  return c.json({
    uploads: rows,
    folders: folderRows,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  });
});

// DELETE /uploads/:id — Delete upload (admin only)
uploadRoutes.delete('/uploads/:id', isAdminMiddleware, async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');

  const [record] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  if (!record) {
    return c.json({ error: 'Upload not found' }, 404);
  }

  // Check if any other records reference the same filename
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(uploads)
    .where(eq(uploads.filename, record.filename));

  // Only delete the actual file if this is the last reference
  if ((countResult?.count ?? 0) <= 1) {
    await c.env.R2_UPLOADS.delete(record.filename);
  }

  // Delete tags and record
  await db.delete(uploadTags).where(eq(uploadTags.uploadId, id));
  await db.delete(uploads).where(eq(uploads.id, id));

  return c.json({ success: true });
});

// PUT /uploads/:id — Move to folder (admin only)
uploadRoutes.put('/uploads/:id', isAdminMiddleware, async (c) => {
  const db = c.get('db');
  const id = c.req.param('id');
  const body = await c.req.json<{ folderId: string }>();

  const [record] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  if (!record) {
    return c.json({ error: 'Upload not found' }, 404);
  }

  const now = new Date().toISOString();
  await db
    .update(uploads)
    .set({ folderId: body.folderId, updatedAt: now })
    .where(eq(uploads.id, id));

  const [updated] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);

  return c.json({
    _id: updated.id,
    filename: updated.filename,
    originalname: updated.originalname || '',
    mimetype: updated.mimetype || '',
    size: updated.size || 0,
    folderId: updated.folderId,
    url: `/uploads/${updated.filename}`,
    createdAt: updated.createdAt || '',
    updatedAt: updated.updatedAt || '',
    createdBy: updated.createdBy || '',
    updatedBy: updated.updatedBy || '',
  });
});

function areMimeTypesCompatible(detected: string, claimed: string): boolean {
  if (detected === claimed) return true;
  const detectedBase = detected.split('/')[0];
  const claimedBase = claimed.split('/')[0];
  if (detectedBase === claimedBase) return true;
  // application/octet-stream is a generic fallback, always compatible
  if (claimed === 'application/octet-stream') return true;
  return false;
}
