import path from "path";

export default {
  root: true,
  extends: ["@arcblock/eslint-config-ts/base"],
  parserOptions: {
    project: path.resolve(__dirname, "tsconfig.eslint.json"),
  },
};
