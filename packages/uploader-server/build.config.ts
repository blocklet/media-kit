import { defineBuildConfig, BuildEntry } from "unbuild";

const pattern = [
  "**/*.js",
  "**/*.jsx",
  "**/*.ts",
  "**/*.tsx",
  "!**/*.stories.js",
  "!**/demo",
  "**/*.json",
];

const shared: BuildEntry = {
  builder: "mkdist",
  input: "./src",
  pattern,
  ext: "js",
  declaration: true,
};

export default defineBuildConfig({
  failOnWarn: false,
  entries: [
    {
      ...shared,
      outDir: "./es",
      format: "esm",
    },
    {
      ...shared,
      outDir: "./lib",
      format: "cjs",
    },
  ],
});
