import { spawn } from "node:child_process";
import http from "node:http";
import net from "node:net";
import { nextCli } from "./node-paths.mjs";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);
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

function portAvailable(listenPort, bindHost) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(listenPort, bindHost);
  });
}

async function waitForPort(listenPort, bindHost, tries = 20) {
  for (let i = 0; i < tries; i += 1) {
    if (await portAvailable(listenPort, bindHost)) return true;
    console.warn(
      `[start] ${bindHost}:${listenPort} in use, retry ${i + 1}/${tries}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function startNext() {
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
}

if (port === healthPort) {
  console.log(
    `[health] Next.js serves health checks on the application port ${port}`,
  );
} else {
  startHealthSidecar();
}

const free = await waitForPort(port, host);
if (!free) {
  console.error(
    `[start] ${host}:${port} is still in use after retries. Stop the previous process and redeploy.`,
  );
  process.exit(1);
}

startNext();
