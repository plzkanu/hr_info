import { spawn } from "node:child_process";
import { nextCli } from "./node-paths.mjs";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

if (port === 1104) {
  console.error(
    "[start] PORT=1104 is reserved on Replit VMs. Use PORT=3000 and next start -p 3000.",
  );
  process.exit(1);
}

const env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || "production",
  HOST: host,
  PORT: String(port),
};
delete env.NODE_TLS_REJECT_UNAUTHORIZED;

const child = spawn(
  process.execPath,
  [nextCli(), "start", "-H", host, "-p", String(port)],
  {
    stdio: "inherit",
    env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
