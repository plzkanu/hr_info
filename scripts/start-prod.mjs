import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

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
      console.warn(`[health] ${healthPort} already in use, skip sidecar`);
      return;
    }
    console.error("[health]", error);
  });

  server.listen(healthPort, "127.0.0.1", () => {
    console.log(`[health] 127.0.0.1:${healthPort}`);
  });
}

if (process.env.REPL_ID) {
  startHealthSidecar();
}

const nextBin = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

const child = spawn(
  process.execPath,
  [nextBin, "start", "-H", host, "-p", String(port)],
  {
    stdio: "inherit",
    env: process.env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
