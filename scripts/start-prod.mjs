import { spawn } from "node:child_process";
import http from "node:http";
import { nextCli } from "./node-paths.mjs";

const host = process.env.HOST ?? "0.0.0.0";
const port = process.env.PORT ?? "3000";
const healthPort = Number(process.env.HEALTH_PORT ?? 1104);

function startHealthSidecar() {
  const server = http.createServer((req, res) => {
    const pathname = (req.url ?? "/").split("?")[0];
    const isHealth =
      pathname === "/" ||
      pathname === "/internal-api" ||
      pathname === "/health" ||
      pathname === "/hr-api/health";

    if (!isHealth) {
      res.writeHead(404);
      res.end();
      return;
    }

    if (req.method === "HEAD") {
      res.writeHead(200);
      res.end();
      return;
    }

    res.writeHead(200, {
      "content-type": "application/json; charset=utf-8",
    });
    res.end(JSON.stringify({ ok: true, service: "hr-info" }));
  });

  server.on("error", (error) => {
    if ("code" in error && error.code === "EADDRINUSE") {
      console.warn(
        `[health] ${healthPort} already in use, skip sidecar and continue`,
      );
      return;
    }
    console.error("[health]", error);
  });

  // Replit Promote는 127.0.0.1:1104 를 조회합니다. 0.0.0.0 으로 열면 둘 다 받습니다.
  server.listen(healthPort, "0.0.0.0", () => {
    console.log(`[health] 0.0.0.0:${healthPort} ready`);
  });
}

function nextEnv() {
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "production",
    HOST: host,
  };
  delete env.NODE_TLS_REJECT_UNAUTHORIZED;
  return env;
}

startHealthSidecar();

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
