import fs from "node:fs";
import path from "node:path";

export function nextCli(cwd = process.cwd()) {
  const bin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
  if (!fs.existsSync(bin)) {
    throw new Error(
      `Next.js CLI가 없습니다: ${bin}. node_modules를 먼저 설치하세요.`,
    );
  }
  return bin;
}

/** PATH에 npm이 없어도 node와 같은 폴더의 npm을 사용합니다. */
export function npmCommand() {
  const dir = path.dirname(process.execPath);
  const candidates = [
    path.join(dir, "npm"),
    path.join(dir, "npm.cmd"),
    path.join(process.cwd(), "node_modules", "npm", "bin", "npm-cli.js"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}
