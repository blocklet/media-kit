module.exports = {
  parserOptions: {
    ecmaVersion: 2022,
  },
  extends: "@arcblock/eslint-config",
  rules: {
    "react-hooks/exhaustive-deps": "off",
    "react/jsx-no-bind": "off",
    "react/no-unstable-nested-components": "off",
    "react-hooks/rules-of-hooks": "off",
  },
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
};
