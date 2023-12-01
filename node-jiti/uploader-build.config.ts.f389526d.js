"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _nodeFs = require("node:fs");
var _unbuild = require("unbuild");

const alias = {
  react: 'preact/compat',
  'react-dom': 'preact/compat',
  'react/jsx-runtime': 'preact/jsx-runtime'
};var _default = exports.default =

(0, _unbuild.defineBuildConfig)({
  entries: ['./src/index', './src/react', './src/middlewares'],
  declaration: true,
  clean: true,
  outDir: 'lib',
  rollup: {
    emitCJS: true,
    esbuild: {
      jsx: 'automatic'
    }
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
          (0, _nodeFs.copyFileSync)(`./lib/${entry.path}`, `./lib/${renamePath}`);
        }
      });
    }
  }
}); /* v7-ccdd467474c7eb03 */