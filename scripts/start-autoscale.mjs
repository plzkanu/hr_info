import http from "node:http";
import { spawn } from "node:child_process";
import { nextCli } from "./node-paths.mjs";

const REPLIT_PORT = 1104;
const listenHost = process.env.HOST ?? "0.0.0.0";
const publicPort = Number(process.env.PORT ?? REPLIT_PORT);
const nextPort = Number(process.env.NEXT_PORT ?? 3000);
const nextHost = "127.0.0.1";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

let nextReady = false;
let stopping = false;
let nextChild = null;

function pathnameOf(req) {
  return (req.url ?? "/").split("?")[0];
}

function isHealthPath(pathname) {
  return (
    pathname === "/" ||
    pathname === "/internal-api" ||
    pathname === "/health" ||
    pathname === "/hr-api/health"
  );
}

function sendStartupOk(req, res) {
  if (res.headersSent) return;
  if (req.method === "HEAD") {
    res.writeHead(200);
    res.end();
    return;
  }
  res.writeHead(200, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify({ ok: true, service: "hr-info" }));
}

function proxyHeaders(req) {
  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null || HOP_BY_HOP.has(key.toLowerCase())) continue;
    headers[key] = value;
  }
  const forwarded = req.socket.remoteAddress;
  if (forwarded) {
    const existing = headers["x-forwarded-for"];
    headers["x-forwarded-for"] = existing
      ? `${existing}, ${forwarded}`
      : forwarded;
  }
  if (!headers["x-forwarded-proto"]) {
    headers["x-forwarded-proto"] = "https";
  }
  if (!headers["x-forwarded-host"] && headers.host) {
    headers["x-forwarded-host"] = headers.host;
  }
  return headers;
}

function proxyToNext(req, res) {
  const proxyReq = http.request(
    {
      hostname: nextHost,
      port: nextPort,
      path: req.url,
      method: req.method,
      headers: proxyHeaders(req),
    },
    (upstream) => {
      res.writeHead(upstream.statusCode ?? 502, upstream.headers);
      upstream.pipe(res);
    },
  );

  proxyReq.on("error", () => {
    if (isHealthPath(pathnameOf(req))) {
      sendStartupOk(req, res);
      return;
    }
    if (!res.headersSent) {
      res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    }
    res.end("Bad Gateway");
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  if (!nextReady && isHealthPath(pathnameOf(req))) {
    sendStartupOk(req, res);
    return;
  }
  proxyToNext(req, res);
});

server.on("error", (error) => {
  console.error("[autoscale] listen failed", error);
  process.exit(1);
});

function markReady() {
  if (nextReady) return;
  nextReady = true;
  console.log(`[autoscale] proxy ${listenHost}:${publicPort} -> ${nextHost}:${nextPort} ready`);
}

function pollNext() {
  if (nextReady || stopping) return;
  const req = http.get(
    `http://${nextHost}:${nextPort}/hr-api/health`,
    (res) => {
      if (res.statusCode && res.statusCode < 500) markReady();
      res.resume();
    },
  );
  req.on("error", () => {});
  req.setTimeout(400, () => req.destroy());
}

function nextEnv() {
  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || "production",
    HOST: nextHost,
    PORT: String(nextPort),
  };
  delete env.NODE_TLS_REJECT_UNAUTHORIZED;
  return env;
}

function startNext() {
  const child = spawn(
    process.execPath,
    [nextCli(), "start", "-H", nextHost, "-p", String(nextPort)],
    {
      stdio: ["inherit", "pipe", "pipe"],
      env: nextEnv(),
    },
  );
  nextChild = child;

  function forward(chunk, dest) {
    dest.write(chunk);
    if (String(chunk).includes("Ready")) markReady();
  }
  child.stdout?.on("data", (chunk) => forward(chunk, process.stdout));
  child.stderr?.on("data", (chunk) => forward(chunk, process.stderr));

  child.on("exit", (code, signal) => {
    if (stopping) return;
    console.error(`[autoscale] Next.js exited code=${code} signal=${signal}`);
    process.exit(code ?? 1);
  });
}

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  console.log(`[autoscale] shutting down (${signal})`);
  if (nextChild && nextChild.pid) {
    nextChild.kill("SIGTERM");
    setTimeout(() => {
      if (nextChild && !nextChild.killed) nextChild.kill("SIGKILL");
    }, 3000).unref();
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 4000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

if (publicPort === nextPort) {
  console.log(
    `[autoscale] PORT=${publicPort} equals Next.js port; starting Next.js only`,
  );
  startNext();
} else {
  server.listen(publicPort, listenHost, () => {
    console.log(
      `[autoscale] ${listenHost}:${publicPort} open, Next.js on ${nextHost}:${nextPort}`,
    );
    startNext();
    setInterval(pollNext, 200).unref();
  });
}
