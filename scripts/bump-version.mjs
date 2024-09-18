/* eslint-disable no-console */
import { execSync } from "child_process";
import { $, chalk, fs, path, YAML } from "zx";
import prompts from "prompts";

const monthMap = {
  一月: "January",
  二月: "February",
  三月: "March",
  四月: "April",
  五月: "May",
  六月: "June",
  七月: "July",
  八月: "August",
  九月: "September",
  十月: "October",
  十一月: "November",
  十二月: "December",
};

const toEnglishDate = (log) =>
  log.replace(/[\u4e00-\u9fa5]+月/g, (match) => monthMap[match]);

const file = fs.readFileSync("pnpm-workspace.yaml", "utf8");
const data = YAML.parse(file);
const dirs = [];
for (const pattern of data.packages) {
  const prefix = pattern.replace("/**", "");
  try {
    const folders = fs
      .readdirSync(prefix)
      .map((folder) => {
        if (folder.startsWith(".")) {
          return;
        }
        return `${prefix}/${folder}`;
      })
      .filter(Boolean);

    dirs.push(...folders);
  } catch (error) {
    // ignore error
  }
}

const canSelectDirs = dirs.map((item) => {
  return {
    title: item,
    value: item,
  };
});

// select dir
const dirResponse = await prompts({
  type: "multiselect",
  name: "value",
  message: "Pick a directory to bump version: ",
  choices: canSelectDirs,
});

const dateRes = await $`export LANG="en_US.UTF-8" && date +'%B %d, %Y'`;
const date = dateRes.stdout.trim();

let newChangelog = "";

try {
  const gitRes = await $`git log --pretty=format:"- %s" "origin/master"...HEAD`;
  newChangelog = gitRes.stdout.trim();
} catch {
  console.error(
    chalk.redBright("Could not get git log, please write CHANGELOG.md.")
  );
}

async function updateSelectedDir(selectedDir) {
  const packageJsonPath = path.join(selectedDir, "package.json");
  const ymlPath = path.join(selectedDir, "blocklet.yml");
  const changelogPath = path.join(selectedDir, "CHANGELOG.md");
  const versionPath = path.join(selectedDir, "version");

  // write changelog
  const changelogResponse = await prompts({
    type: "text",
    name: "value",
    message: "Please write changelog:",
    initial: newChangelog,
  });

  execSync(`bumpp ${packageJsonPath}`, {
    stdio: "inherit",
  });

  console.log(chalk.greenBright(`[info]: ${packageJsonPath} modified.`));

  const { version } = await fs.readJSON(packageJsonPath);

  try {
    const blockletYaml = await fs.readFileSync(ymlPath, "utf8");
    const yamlConfig = YAML.parse(blockletYaml);
    yamlConfig.version = version;
    fs.writeFileSync(ymlPath, YAML.stringify(yamlConfig, 2));
    console.log(chalk.greenBright(`[info]: ${ymlPath} modified.`));
  } catch (error) {
    console.error(chalk.yellowBright(`[warn]: Could not find ${ymlPath}.`));
  }

  const title = `## ${version} (${date})`;

  await fs.ensureFile(changelogPath);
  const oldChangelog = await fs.readFile(changelogPath, "utf8");
  const changelog = [title, changelogResponse.value, oldChangelog]
    .filter((item) => !!item)
    .join("\n\n");

  await fs.writeFile(changelogPath, toEnglishDate(changelog));
  console.log(chalk.greenBright(`[info]: ${changelogPath} modified.`));

  await fs.writeFileSync(versionPath, version);
  console.log(chalk.greenBright(`[info]: ${versionPath} modified.`));

  execSync(`code ${changelogPath}`, {
    stdio: "inherit",
  });
}

const selectedDirList = dirResponse.value;

Promise.all(selectedDirList.map(updateSelectedDir));
