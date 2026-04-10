import { Context, Next } from 'hono';
import type { HonoEnv, CallerIdentityDTO } from '../types';

// === JWT identity cache — avoid repeated AUTH_SERVICE RPC for the same token ===
const JWT_CACHE_MAX_SIZE = 1000;
const JWT_CACHE_DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes fallback
const jwtIdentityCache = new Map<string, { identity: CallerIdentityDTO; expiresAt: number }>();

function getJwtExpiry(jwt: string): number | null {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload));
    if (typeof decoded.exp === 'number') {
      return decoded.exp * 1000;
    }
  } catch {
    // Fall through — use default TTL
  }
  return null;
}

function getCachedIdentity(key: string): CallerIdentityDTO | null {
  const entry = jwtIdentityCache.get(key);
  if (!entry) return null;
  if (Date.now() >= entry.expiresAt) {
    jwtIdentityCache.delete(key);
    return null;
  }
  return entry.identity;
}

function cacheIdentity(key: string, identity: CallerIdentityDTO): void {
  if (jwtIdentityCache.size >= JWT_CACHE_MAX_SIZE) {
    const firstKey = jwtIdentityCache.keys().next().value;
    if (firstKey) jwtIdentityCache.delete(firstKey);
  }
  const expiresAt = getJwtExpiry(key) ?? Date.now() + JWT_CACHE_DEFAULT_TTL_MS;
  jwtIdentityCache.set(key, { identity, expiresAt });
}

// Paths that must bypass auth (login/session/logout are handled by DID auth proxy)
const AUTH_BYPASS_PREFIXES = ['/api/did/', '/api/uploader/'];

/**
 * Auth middleware — resolves caller identity via AUTH_SERVICE RPC (Service Binding to DID service).
 * Extracts JWT from login_token cookie or Authorization header, calls resolveIdentity,
 * and sets user context for downstream handlers.
 */
export async function authMiddleware(c: Context<HonoEnv>, next: Next) {
  // Skip auth for DID login/session routes (they're proxied to AUTH_SERVICE directly)
  const path = new URL(c.req.url).pathname;
  if (AUTH_BYPASS_PREFIXES.some((p) => path.startsWith(p))) {
    return next();
  }

  const authService = c.env.AUTH_SERVICE;
  if (!authService || typeof authService.resolveIdentity !== 'function') {
    // AUTH_SERVICE not configured — reject request
    return c.json({ error: 'Authentication service not available' }, 503);
  }

  try {
    const cookieHeader = c.req.header('Cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)login_token=([^;]*)/);
    const jwt = match ? decodeURIComponent(match[1]) : null;
    const authHeader = c.req.header('Authorization') || null;

    // Try cache first — extract raw token from Bearer header for correct expiry parsing
    const rawToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const cacheKey = jwt || rawToken;
    let caller: CallerIdentityDTO | null = null;
    if (cacheKey) {
      caller = getCachedIdentity(cacheKey);
    }

    if (!caller) {
      caller = await authService.resolveIdentity(jwt, authHeader, c.env.APP_PID);
      if (caller && cacheKey) {
        cacheIdentity(cacheKey, caller);
      }
    }

    if (!caller) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Map caller identity to UserContext — role comes entirely from AUTH_SERVICE
    const role = caller.role === 'owner' || caller.role === 'admin' ? 'admin' : caller.role || 'member';

    c.set('user', {
      id: caller.did,
      role,
    });
  } catch (e: any) {
    console.error('[Auth] resolveIdentity error:', e?.message || e);
    return c.json({ error: 'Authentication failed' }, 401);
  }

  return next();
}

export async function isAdminMiddleware(c: Context<HonoEnv>, next: Next) {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  return next();
}
