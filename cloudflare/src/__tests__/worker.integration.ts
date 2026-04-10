import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

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

  it('auth-protected routes require authentication (no AUTH_SERVICE returns 503)', async () => {
    // Without AUTH_SERVICE binding, auth middleware returns 503
    const res = await SELF.fetch('https://media-kit.test/api/uploads');
    expect([401, 503]).toContain(res.status);
  });

  it('returns __blocklet__.js with app metadata', async () => {
    const res = await SELF.fetch('https://media-kit.test/__blocklet__.js?type=json');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body).toHaveProperty('appName');
    expect(body.cloudflareWorker).toBe(true);
  });

  it('DID auth proxy returns 503 without AUTH_SERVICE', async () => {
    const res = await SELF.fetch('https://media-kit.test/api/did/session');
    expect(res.status).toBe(503);
  });
});
