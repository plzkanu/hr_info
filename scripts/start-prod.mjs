import { spawn } from "node:child_process";
import { nextCli } from "./node-paths.mjs";

const REPLIT_RESERVED_PORT = 1104;
const host = process.env.HOST ?? "0.0.0.0";
const requestedPort = Number(process.env.PORT ?? 3000);
const port =
  requestedPort === REPLIT_RESERVED_PORT ? 3000 : requestedPort;

if (requestedPort === REPLIT_RESERVED_PORT) {
  console.warn(
    `[start] PORT=${requestedPort} is reserved by Replit health/proxy; Next.js listens on ${port}`,
  );
}

function nextEnv() {
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "production",
    HOST: host,
    PORT: String(port),
  };
  delete env.NODE_TLS_REJECT_UNAUTHORIZED;
  return env;
}

const nextBin = nextCli();
const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", host, "-p", String(port)],
  {
    stdio: "inherit",
    env: nextEnv(),
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
