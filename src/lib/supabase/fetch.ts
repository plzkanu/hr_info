import { isSupabaseTlsInsecure } from "./config";

export function formatSupabaseNetworkError(message: string): string {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("password_must_change") ||
    normalized.includes("permissions")
  ) {
    return (
      "employee_users 테이블 스키마가 최신이 아닙니다. SQL Editor에서 " +
      "supabase/apply-all-migrations.sql을 다시 실행하세요."
    );
  }
  if (
    normalized.includes("could not find the table") ||
    normalized.includes("does not exist") ||
    normalized.includes("schema cache")
  ) {
    return (
      "Supabase에 필요한 테이블이 없습니다. 사원명부는 ens_emp_roster, " +
      "로그인 계정은 employee_users, 인사상세는 employee_appointments / " +
      "employee_family / employee_education / employee_licenses / employee_career / " +
      "employee_languages / employee_reward_penalty 입니다. SQL Editor에서 " +
      "supabase/apply-all-migrations.sql을 실행하세요."
    );
  }
  if (
    normalized.includes("fetch failed") ||
    normalized.includes("certificate") ||
    normalized.includes("ssl") ||
    normalized.includes("econnrefused") ||
    normalized.includes("enotfound") ||
    normalized.includes("timeout")
  ) {
    return (
      "Supabase에 연결할 수 없습니다. 회사 VPN/방화벽 환경이면 .env.local에 " +
      "SUPABASE_SSL_VERIFY=0을 추가한 뒤 개발 서버를 재시작하세요."
    );
  }
  return message;
}

let supabaseTlsBypassApplied = false;

export function applySupabaseTlsBypassIfConfigured(): void {
  if (supabaseTlsBypassApplied || !isSupabaseTlsInsecure()) {
    return;
  }
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  supabaseTlsBypassApplied = true;
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[supabase] SUPABASE_SSL_VERIFY=0 — TLS 인증서 검증을 생략합니다.",
    );
  }
}
