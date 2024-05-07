import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createBlockletPlugin } from 'vite-plugin-blocklet';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    optimizeDeps: {
      force: true, // use @blocklet/uploader need it
    },
    server: {
      fs: {
        strict: false, // monorepo and pnpm required
        allow: ['../../'], // monorepo and pnpm required
      },
    },
    plugins: [react(), createBlockletPlugin()],
  };
});
