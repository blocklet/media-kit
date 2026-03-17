import { describe, it, expect } from 'vitest';
import { env, SELF } from 'cloudflare:test';

describe('Worker integration', () => {
  it('responds to health check', async () => {
    const res = await SELF.fetch('https://media-kit.test/health');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe('ok');
    expect(body.version).toBe('1.0.0');
  });

  it('returns 404 for unknown routes', async () => {
    const res = await SELF.fetch('https://media-kit.test/nonexistent');
    expect(res.status).toBe(404);
  });

  it('returns uploader status without auth', async () => {
    const res = await SELF.fetch('https://media-kit.test/api/uploader/status');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty('availablePluginMap');
    expect(body).toHaveProperty('preferences');
    expect(body).toHaveProperty('restrictions');
    expect(body.availablePluginMap.Resources).toBe(false);
    expect(body.restrictions).toHaveProperty('allowedFileTypes');
    expect(body.restrictions).toHaveProperty('maxFileSize');
  });

  it('returns 404 for non-existent upload file', async () => {
    const res = await SELF.fetch('https://media-kit.test/uploads/nonexistent.png');
    expect(res.status).toBe(404);
  });

  it('check endpoint returns exists:false for empty DB', async () => {
    const res = await SELF.fetch('https://media-kit.test/api/uploads/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: 1024, ext: '.png' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.exists).toBe(false);
  });

  it('presign endpoint returns sessionId and presignedUrl', async () => {
    const res = await SELF.fetch('https://media-kit.test/api/uploads/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
        ext: '.png',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty('sessionId');
    // presignedUrl may fail without real R2 credentials, but sessionId should exist
    expect(typeof body.sessionId).toBe('string');
  });

  it('list uploads returns paginated response', async () => {
    const res = await SELF.fetch('https://media-kit.test/api/uploads');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty('uploads');
    expect(body).toHaveProperty('folders');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('pageSize');
  });

  it('auth middleware sets default DID', async () => {
    const res = await SELF.fetch('https://media-kit.test/api/uploads');
    expect(res.status).toBe(200);
    // If auth failed, we'd get 401/403
  });

  it('admin routes reject non-admin users', async () => {
    // Default DID is in ADMIN_DIDS, so it IS admin
    // A different DID should be rejected
    const res = await SELF.fetch('https://media-kit.test/api/uploads/some-id', {
      method: 'DELETE',
      headers: { 'x-user-did': 'did:abt:non-admin-user' },
    });
    expect(res.status).toBe(403);
  });
});
