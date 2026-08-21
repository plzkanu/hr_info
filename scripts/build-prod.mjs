import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { nextCli, npmCommand } from "./node-paths.mjs";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureDependencies() {
  const nextPath = path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  if (fs.existsSync(nextPath)) {
    return;
  }

  const npm = npmCommand();
  if (!npm) {
    throw new Error(
      "npm을 PATH에서도 node 옆에서도 찾지 못했습니다. 게시 환경에 Node.js가 있는지 확인하세요.",
    );
  }

  console.log(`[build] installing dependencies with ${npm}`);
  if (npm.endsWith("npm-cli.js")) {
    run(process.execPath, [npm, "install"]);
  } else {
    run(npm, ["install"]);
  }
}

ensureDependencies();
run(process.execPath, [nextCli(), "build"]);
