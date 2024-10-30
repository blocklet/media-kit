import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createBlockletPlugin } from 'vite-plugin-blocklet';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    // optimizeDeps: {
    //   force: true, // use @blocklet/uploader need it
    // },
    server: {
      fs: {
        strict: false, // monorepo and pnpm required
        allow: ['../../'], // monorepo and pnpm required
      },
    },
    plugins: [react(), createBlockletPlugin()],
    ...(mode === 'development' && {
      resolve: {
        alias: [
          {
            find: '@blocklet/uploader',
            replacement: join(__dirname, '../../packages/uploader/src/react.ts'),
          },
          {
            find: '@blocklet/uploader/middlewares',
            replacement: join(__dirname, '../../packages/uploader/src/middlewares.ts'),
          },
          {
            find: '@blocklet/xss',
            replacement: join(__dirname, '../../packages/xss/src/index.ts'),
          },
        ],
      },
    }),
  };
});
