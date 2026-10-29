/** Node2Shell(CVE-2026-111497) 등 24.x 보안 수정본 미만이면 빌드를 막습니다. */
const raw = process.versions.node;
const [maj, min, patch] = raw.split(".").map((part) => Number.parseInt(part, 10) || 0);

function fail(message) {
  console.error(`[node] ${message}`);
  process.exit(1);
}

if (maj < 22) {
  fail(
    `v${raw}는 지원하지 않습니다. Node.js 24.22.1 이상(또는 22.22 이상)을 설치하세요.`,
  );
}

if (maj === 22 && min < 22) {
  fail(
    `v${raw}는 22.x 보안 수정본 미만입니다. 22.22.0 이상으로 올리세요.`,
  );
}

if (maj === 23) {
  fail(`v${raw}는 지원이 종료된 분기입니다. Node.js 24.22.1 이상을 쓰세요.`);
}

if (maj === 24 && (min < 22 || (min === 22 && patch < 1))) {
  fail(
    `v${raw}는 Node2Shell 패치 전 24.x입니다. 24.22.1 이상(현재 권장 24.22.2)으로 올리세요.`,
  );
}
