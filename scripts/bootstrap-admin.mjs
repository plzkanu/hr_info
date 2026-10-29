import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function env(name) {
  return (process.env[name] ?? "").trim();
}

function argValue(flag) {
  const prefix = `${flag}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : "";
}

loadEnvFile(path.join(process.cwd(), ".env.local"));
loadEnvFile(path.join(process.cwd(), ".env"));

const url = env("NEXT_PUBLIC_SUPABASE_URL");
const key = env("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !key) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.",
  );
  process.exit(1);
}

const adminId = (
  argValue("--id") ||
  env("BOOTSTRAP_ADMIN_ID") ||
  "hradmin"
)
  .trim()
  .toLowerCase();

if (!adminId || adminId === "admin") {
  console.error("사용할 수 없는 관리자 아이디입니다.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { count, error: countError } = await supabase
  .from("employee_users")
  .select("*", { count: "exact", head: true });

if (countError) {
  console.error("계정 테이블을 확인하지 못했습니다.", countError.message);
  process.exit(1);
}

if ((count ?? 0) > 0) {
  console.error(
    "이미 로그인 계정이 있습니다. 최초 관리자 생성은 빈 테이블에서만 됩니다. 이후에는 사용자 관리 화면을 이용하세요.",
  );
  process.exit(1);
}

const temporaryPassword = randomBytes(18).toString("base64url");
const passwordHash = await bcrypt.hash(temporaryPassword, 10);
const { error } = await supabase.from("employee_users").insert({
  id: adminId,
  name: "시스템 관리자",
  password_hash: passwordHash,
  role: "admin",
  department: "경영지원팀",
  active: true,
  password_must_change: true,
  permissions: [],
});

if (error) {
  console.error("최초 관리자를 만들지 못했습니다.", error.message);
  process.exit(1);
}

console.log("최초 관리자를 만들었습니다. 임시 비밀번호는 지금만 표시됩니다.");
console.log(`id=${adminId}`);
console.log(`temporaryPassword=${temporaryPassword}`);
