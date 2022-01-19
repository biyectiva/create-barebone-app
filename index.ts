#!/usr/bin/env node

import Commander from "commander";
import chalk from "chalk";
import prompts from "prompts";
import path from "path";
import checkForUpdate from "update-check";
import packageJson from "./package.json";
import { validateNpmName } from "./helpers/validate-pkg";
import { shouldUseYarn } from "./helpers/should-use-yarn";
import { createApp } from "./create-app";

let projectPath: string = "";

const program = new Commander.Command("create-barebone-app")
  .version(packageJson.version)
  .arguments("[project-directory]")
  .usage(`${chalk.green("[project-directory]")} [options]`)
  .action((name) => {
    projectPath = name;
  })
  .option("--use-npm",
    `
  Explicitly tell the CLI to bootstrap the app using npm
`
  )
  .allowUnknownOption()
  .parse(process.argv);

async function run(): Promise<void> {
  if (typeof projectPath === "string") {
    projectPath.trim();
  }

  if (!projectPath) {
    const res = await prompts({
      type: "text",
      name: "projectPath",
      message: "What is the name of your project?",
      initial: "my-barebone-app",
      validate: (name) => {
        const validation = validateNpmName(path.basename(path.resolve(name)));
        if (validation.valid) {
          return true;
        }
        return "Invalid project name: " + validation.problems![0];
      },
    });

    if (typeof res.projectPath === "string") {
      projectPath = res.projectPath.trim();
    }
  }

  if (!projectPath) {
    console.log();
    console.log("Please specify the project directory:");
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green("[project-directory]")}`
    );
    console.log();
    console.log("For example:");
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green("my-barebone-app")}`
    );
    console.log();
    console.log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }

  const resolvedProjectPath = path.resolve(projectPath);
  const projectName = path.basename(resolvedProjectPath);

  const { valid, problems } = validateNpmName(projectName);
  if (!valid) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${projectName}"`
      )} because of npm naming restrictions:`
    );

    problems!.forEach((p) => console.error(`    ${chalk.red.bold("*")} ${p}`));
    process.exit(1);
  }

  const options = program.opts();

  await createApp({
    appPath: resolvedProjectPath,
    useNpm: !!options.useNpm,
  })
}

const update = checkForUpdate(packageJson).catch(() => null);

async function notifyUpdate(): Promise<void> {
  try {
    const res = await update;
    if (res?.latest) {
      const isYarn = shouldUseYarn();

      console.log(res);
      console.log(
        chalk.yellow.bold(
          "A new version of `create-barebone-app` is available!"
        )
      );
      console.log(
        "You can update by running: " +
        chalk.cyan(
          isYarn
            ? "yarn global add create-barebone-app"
            : "npm i -g create-barebone-app"
        )
      );
      console.log();
    }
    process.exit();
  } catch {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async (reason) => {
    console.log();
    console.log("Aborting installation.");
    if (reason.command) {
      console.log(`  ${chalk.cyan(reason.command)} has failed.`);
    } else {
      console.log(chalk.red("Unexpected error. Please report it as a bug:"));
      console.log(reason);
    }
    console.log();

    await notifyUpdate();

    process.exit(1);
  });
