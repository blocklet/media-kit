import type { DrizzleD1Database } from 'drizzle-orm/d1';

export interface CallerIdentityDTO {
  did: string;
  pk: string;
  displayName: string;
  avatar: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  authMethod: 'passkey' | 'did-connect' | 'access-key' | 'oauth' | 'email';
  accessKeyId?: string;
  approved: boolean;
}

export interface Env {
  // D1 Database
  DB: D1Database;
  // R2 Bucket
  R2_UPLOADS: R2Bucket;
  // R2 S3 credentials (for presigned URLs)
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  CF_ACCOUNT_ID: string;
  // R2 origin domain for cf.image (protected by IP Access Rule)
  R2_ORIGIN_DOMAIN: string;
  // Environment config
  ENVIRONMENT: string;
  MAX_UPLOAD_SIZE: string;
  ALLOWED_FILE_TYPES: string;
  USE_AI_IMAGE: string;
  // App identity
  APP_SK: string;    // 64-byte hex secret key — used to register & derive instance DID
  APP_NAME: string;
  APP_PID: string;   // Derived from APP_SK after registerApp; can also be set explicitly
  APP_PREFIX: string; // Mount prefix (e.g. '/media-kit') — empty or '/' means root
  // Auth Service (DID Connect via Service Binding)
  AUTH_SERVICE: {
    fetch: (request: Request | string) => Promise<Response>;
    resolveIdentity: (
      jwt: string | null,
      authorizationHeader: string | null,
      instanceDid?: string
    ) => Promise<CallerIdentityDTO | null>;
    verify: (jwt: string) => Promise<CallerIdentityDTO | null>;
    verifyFull: (jwt: string) => Promise<CallerIdentityDTO | null>;
    registerApp: (config: {
      instanceDid: string;
      appSk: string;
      appPsk?: string;
      appName?: string;
      appDescription?: string;
    }) => Promise<{ instanceDid: string }>;
  };
  // Unsplash
  UNSPLASH_KEY: string;
  UNSPLASH_SECRET: string;
  // AIGNE Hub
  AIGNE_HUB_URL: string;
  AIGNE_HUB_API_KEY: string;
  // Upload Queue (for large file async confirm)
  CONFIRM_QUEUE: Queue<ConfirmQueueMessage>;
}

export interface ConfirmQueueMessage {
  sessionId: string;
  userId: string;
}

export interface UserContext {
  id: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
}

// Hono env bindings
export type HonoEnv = {
  Bindings: Env;
  Variables: {
    user: UserContext;
    db: DrizzleD1Database;
  };
};

// API response types
export interface CheckResponse {
  exists: boolean;
  url?: string;
  filename?: string;
  uploadId?: string;
}

export interface PresignResponse {
  sessionId: string;
  presignedUrl?: string;
  multipart?: boolean;
  uploadId?: string;
  key?: string;
  partSize?: number;
  partCount?: number;
}

export interface ConfirmResponse {
  _id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  url: string;
  createdAt: string;
  createdBy: string;
  tags?: string[];
}

export interface ListResponse {
  data: ConfirmResponse[];
  total: number;
  page: number;
  pageSize: number;
}
