import { spawn } from "node:child_process";
import http from "node:http";
import { nextCli } from "./node-paths.mjs";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
const healthPort = Number(process.env.HEALTH_PORT ?? 1104);
const maxStartAttempts = 10;

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

  // Replit Promote는 127.0.0.1:1104 만 조회합니다. 앱 포트와 겹치지 않게 loopback만 엽니다.
  server.listen(healthPort, "127.0.0.1", () => {
    console.log(`[health] 127.0.0.1:${healthPort} ready`);
  });
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

function startNext(attempt = 1) {
  const nextBin = nextCli();
  const child = spawn(
    process.execPath,
    [nextBin, "start", "-H", host, "-p", String(port)],
    {
      stdio: ["inherit", "pipe", "pipe"],
      env: nextEnv(),
    },
  );

  let addrInUse = false;
  function forward(chunk, dest) {
    dest.write(chunk);
    if (String(chunk).includes("EADDRINUSE")) addrInUse = true;
  }
  child.stdout?.on("data", (chunk) => forward(chunk, process.stdout));
  child.stderr?.on("data", (chunk) => forward(chunk, process.stderr));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    if ((addrInUse || code !== 0) && addrInUse && attempt < maxStartAttempts) {
      console.warn(
        `[start] ${host}:${port} in use, retry ${attempt}/${maxStartAttempts} in 1s`,
      );
      setTimeout(() => startNext(attempt + 1), 1000);
      return;
    }
    process.exit(code ?? 1);
  });
}

if (port === healthPort) {
  console.log(
    `[health] Next.js serves health checks on the application port ${port}`,
  );
} else {
  startHealthSidecar();
}

startNext();
