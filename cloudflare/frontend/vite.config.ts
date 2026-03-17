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

      // @arcblock/* shims (each needs its own file for correct default exports)
      '@arcblock/did-connect-react/lib/Session': join(shimDir, 'did-connect-react-session.tsx'),
      '@arcblock/did-connect-react/lib/Button': join(shimDir, 'did-connect-react-button.tsx'),
      '@arcblock/ux/lib/Toast': join(shimDir, 'ux-toast.tsx'),
      '@arcblock/ux/lib/Center': join(shimDir, 'ux-center.tsx'),
      '@arcblock/ux/lib/Config': join(shimDir, 'ux-config.tsx'),
      '@arcblock/ux/lib/withTracker': join(shimDir, 'ux-with-tracker.tsx'),
      '@arcblock/ux/lib/Locale/context': join(shimDir, 'ux-locale-context.tsx'),
      '@arcblock/ux/lib/Result': join(shimDir, 'ux-result.tsx'),
      '@arcblock/ux/lib/Button': join(shimDir, 'ux-button.tsx'),
      '@arcblock/ux/lib/SplitButton': join(shimDir, 'ux-split-button.tsx'),
      '@arcblock/ux/lib/Dialog': join(shimDir, 'ux-dialog.tsx'),
      '@arcblock/ux/lib/Empty': join(shimDir, 'ux-empty.tsx'),
      '@arcblock/did': join(shimDir, 'arcblock-did.ts'),

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
