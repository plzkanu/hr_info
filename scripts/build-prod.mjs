import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { nextCli, npmCommand } from "./node-paths.mjs";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
    shell: false,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function hasBuildDependency(nameParts) {
  return fs.existsSync(path.join(process.cwd(), "node_modules", ...nameParts));
}

function ensureDependencies() {
  const hasNext = hasBuildDependency(["next", "dist", "bin", "next"]);
  const hasTailwindPostcss = hasBuildDependency(["@tailwindcss", "postcss"]);
  const hasTypescript = hasBuildDependency(["typescript"]);
  if (hasNext && hasTailwindPostcss && hasTypescript) {
    return;
  }

  const npm = npmCommand();
  if (!npm) {
    throw new Error(
      "npm을 PATH에서도 node 옆에서도 찾지 못했습니다. 게시 환경에 Node.js가 있는지 확인하세요.",
    );
  }

  const installEnv = {
    ...process.env,
    NODE_ENV: "development",
    NPM_CONFIG_PRODUCTION: "false",
  };

  console.log(
    `[build] installing with devDependencies (NODE_ENV was ${process.env.NODE_ENV ?? "unset"})`,
  );
  if (npm.endsWith("npm-cli.js")) {
    run(process.execPath, [npm, "install", "--include=dev"], installEnv);
  } else {
    run(npm, ["install", "--include=dev"], installEnv);
  }
}

ensureDependencies();
run(process.execPath, [nextCli(), "build"]);
