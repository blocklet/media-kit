module.exports = {
  root: true,
  extends: '@arcblock/eslint-config',
  env: {
    es6: true,
    browser: true,
    node: true,
    mocha: true,
    jest: true,
  },
  globals: {
    logger: true,
  },
  rules: {
    'react/require-default-props': [
      'error',
      {
        functions: 'defaultArguments',
      },
    ],
  },
};
