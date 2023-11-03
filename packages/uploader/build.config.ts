import { copyFileSync } from 'node:fs';
import { defineBuildConfig } from 'unbuild';

const alias = {
  react: 'preact/compat',
  'react-dom': 'preact/compat',
  'react/jsx-runtime': 'preact/jsx-runtime',
};

export default defineBuildConfig({
  entries: ['./src/index', './src/react', './src/middlewares'],
  declaration: true,
  clean: true,
  outDir: 'lib',
  rollup: {
    emitCJS: true,
    esbuild: {
      jsx: 'automatic',
    },
    // alias: {
    //   entries: alias,
    // },
  },
  // alias,
  failOnWarn: false,
  externals: ['react', 'ahooks', 'preact', '@mui/material', '@mui/icons-material', '@mui/system'],
  hooks: {
    'build:done'({ buildEntries }) {
      buildEntries.forEach((entry) => {
        if (entry.path.endsWith('.cjs')) {
          const renamePath = entry.path.replace('.cjs', '.js');
          copyFileSync(`./lib/${entry.path}`, `./lib/${renamePath}`);
        }
      });
    },
  },
});
