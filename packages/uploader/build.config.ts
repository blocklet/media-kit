import { defineBuildConfig, BuildEntry } from 'unbuild';

const pattern = [
  '**/*.js',
  '**/*.jsx',
  '**/*.ts',
  '**/*.tsx',
  '**/*.png',
  '!**/*.stories.js',
  '!**/demo',
  '**/*.svg',
  '**/*.json',
];

const shared: BuildEntry = {
  builder: 'mkdist',
  input: './src',
  pattern,
  ext: 'js',
  esbuild: {
    jsx: 'automatic',
  },
  declaration: true,
};
export default defineBuildConfig({
  failOnWarn: false,
  externals: ['fflate'],
  entries: [
    {
      ...shared,
      outDir: './es',
      format: 'esm',
    },
    {
      ...shared,
      outDir: './lib',
      format: 'cjs',
    },
  ],
});
