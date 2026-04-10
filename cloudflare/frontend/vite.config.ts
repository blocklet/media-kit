import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { join } from 'path';

const root = join(__dirname, '../..');
const shimDir = join(__dirname, 'src/shims');
const uploaderSrc = join(root, 'packages/uploader/src');
const imageBinSrc = join(root, 'blocklets/image-bin/src');

export default defineConfig({
  // @ts-ignore
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
  server: {
    port: 3030,
    proxy: {
      '/api': 'http://localhost:8787',
      '/uploads': 'http://localhost:8787',
      '/health': 'http://localhost:8787',
      '/__blocklet__.js': 'http://localhost:8787',
      '/.well-known/service': 'http://localhost:8787',
    },
    fs: {
      strict: false,
      allow: ['../../../'],
    },
  },
  resolve: {
    alias: {
      // Original frontend source
      'image-bin-src': imageBinSrc,

      // @blocklet/uploader → monorepo source
      '@blocklet/uploader': join(uploaderSrc, 'react.ts'),
      '@blocklet/uploader/middlewares': join(uploaderSrc, 'middlewares.ts'),

      // @blocklet/* shims
      '@blocklet/js-sdk': join(shimDir, 'blocklet-js-sdk.ts'),
      '@blocklet/ui-react/lib/Dashboard': join(shimDir, 'blocklet-ui-react-dashboard.tsx'),
      '@blocklet/ui-react/lib/Header': join(shimDir, 'blocklet-ui-react-header.tsx'),
      '@blocklet/ui-react/lib/Footer': join(shimDir, 'blocklet-ui-react-footer.tsx'),
      '@blocklet/ui-react/lib/ComponentInstaller': join(shimDir, 'blocklet-ui-react.tsx'),

      // @arcblock/did-connect-react shims (depends on Blocklet Server session API)
      '@arcblock/did-connect-react/lib/Session': join(shimDir, 'did-connect-react-session.tsx'),
      '@arcblock/did-connect-react/lib/Button': join(shimDir, 'did-connect-react-button.tsx'),
      // @arcblock/ux and @arcblock/did — use real packages (no Blocklet Server dependency)

      // Node.js polyfill
      path: 'path-browserify',
    },
    dedupe: ['react', 'react-dom', '@mui/material', '@emotion/react', '@emotion/styled', 'lodash'],
  },
  define: {
    'process.env': {},
    'process.platform': '"browser"',
  },
  optimizeDeps: {
    include: ['path-browserify'],
  },
});
