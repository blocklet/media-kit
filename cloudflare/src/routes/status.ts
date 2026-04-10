import { Hono } from 'hono';
import type { HonoEnv } from '../types';

export const statusRoutes = new Hono<HonoEnv>();

/**
 * GET /uploader/status — Return uploader config for the frontend.
 */
statusRoutes.get('/uploader/status', async (c) => {
  const env = c.env;

  const allowedFileTypes = env.ALLOWED_FILE_TYPES || '.jpeg,.png,.gif,.svg,.webp,.bmp,.ico';
  const maxUploadSize = env.MAX_UPLOAD_SIZE || '100MB';
  const isUnsplashEnabled = !!(env.UNSPLASH_KEY && env.UNSPLASH_SECRET);
  const isAiImageEnabled = env.USE_AI_IMAGE !== 'false';

  return c.json({
    uploadMode: 'presigned',
    restrictions: {
      allowedFileExts: allowedFileTypes,
      maxFileSize: maxUploadSize,
    },
    availablePluginMap: {
      Uploaded: true,
      Resources: false,
      ...(isUnsplashEnabled ? { Unsplash: true } : {}),
      ...(isAiImageEnabled ? { AIImage: true } : {}),
    },
  });
});
