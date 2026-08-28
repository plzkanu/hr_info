import { spawnSync } from "node:child_process";
import { nextCli } from "./node-paths.mjs";

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

const buildAt = new Date().toISOString();
console.log(`[build] NEXT_PUBLIC_BUILD_AT=${buildAt}`);
run(process.execPath, [nextCli(), "build"], {
  ...process.env,
  NEXT_PUBLIC_BUILD_AT: buildAt,
});
