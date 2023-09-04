import { copyFileSync } from 'node:fs';
import { defineBuildConfig } from 'unbuild';

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
  },
  failOnWarn: false,
  externals: ['react', 'ahooks', 'preact'],
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
