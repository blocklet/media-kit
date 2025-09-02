import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createBlockletPlugin } from 'vite-plugin-blocklet';
import { join } from 'path';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  const alias = {};
  if (isDevelopment) {
    alias['@blocklet/uploader'] = join(__dirname, '../../packages/uploader/src/react.ts');
    alias['@blocklet/uploader/middlewares'] = join(__dirname, '../../packages/uploader/src/middlewares.ts');
    alias['@blocklet/xss'] = join(__dirname, '../../packages/xss/src/index.ts');
  }

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
    plugins: [react(), createBlockletPlugin(), svgr()],
    resolve: {
      alias,
      dedupe: [
        //
        '@blocklet/ui-react',
        '@arcblock/ux',
        '@arcblock/did-connect-react',
        '@mui/material',
        // '@mui/utils',
        '@mui/icons-material',
        'react',
        'react-dom',
        'lodash',
        'bn.js',
      ],
    },
  };
});
