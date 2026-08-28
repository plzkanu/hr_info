import { spawn } from "node:child_process";
import http from "node:http";
import { nextCli } from "./node-paths.mjs";

const host = process.env.HOST ?? "0.0.0.0";
const port = process.env.PORT ?? "3000";
const healthPort = Number(process.env.HEALTH_PORT ?? 1104);

function startHealthSidecar() {
  return new Promise((resolve) => {
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
        resolve();
        return;
      }
      console.error("[health]", error);
      resolve();
    });

    server.listen(healthPort, "127.0.0.1", () => {
      console.log(`[health] 127.0.0.1:${healthPort} ready`);
      resolve();
    });
  });
}

function nextEnv() {
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "production",
    HOST: host,
  };
  // Replit 공개 HTTPS에서는 회사 VPN용 TLS 우회가 필요 없고,
  // NODE_TLS_REJECT_UNAUTHORIZED=0 은 기동 경고만 남깁니다.
  delete env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (
    process.env.REPL_ID ||
    process.env.REPLIT_DEPLOYMENT ||
    process.env.REPL_SLUG
  ) {
    delete env.SUPABASE_SSL_VERIFY;
  }
  return env;
}

await startHealthSidecar();

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
