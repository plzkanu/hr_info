function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function isSupabaseConfigured() {
  return Boolean(
    readEnv("NEXT_PUBLIC_SUPABASE_URL") && readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

export function isManmanageConfigured() {
  return Boolean(
    readEnv("MANMANAGE_SUPABASE_URL") &&
      readEnv("MANMANAGE_SUPABASE_SERVICE_ROLE_KEY"),
  );
}

/** 사원명부·발령 등 인사 원천. manmanage가 있으면 그쪽을 씁니다. */
export function isHrDataConfigured() {
  return isManmanageConfigured() || isSupabaseConfigured();
}

export function getSupabaseConfigError() {
  const missing: string[] = [];
  if (!readEnv("NEXT_PUBLIC_SUPABASE_URL")) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!readEnv("SUPABASE_SERVICE_ROLE_KEY")) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (missing.length === 0) {
    return null;
  }
  return `다음 환경 변수가 필요합니다: ${missing.join(", ")}`;
}

export function getManmanageConfigError() {
  const missing: string[] = [];
  if (!readEnv("MANMANAGE_SUPABASE_URL")) {
    missing.push("MANMANAGE_SUPABASE_URL");
  }
  if (!readEnv("MANMANAGE_SUPABASE_SERVICE_ROLE_KEY")) {
    missing.push("MANMANAGE_SUPABASE_SERVICE_ROLE_KEY");
  }
  if (missing.length === 0) {
    return null;
  }
  return `다음 환경 변수가 필요합니다: ${missing.join(", ")}`;
}

/** 회사 VPN/방화벽에서 인증서 폐기 목록(OCSP) 검사 실패 시 Supabase 연결용 */
export function isSupabaseTlsInsecure(): boolean {
  const key = process.env.SUPABASE_SSL_VERIFY;
  if (key === undefined) return false;
  const normalized = key.trim().toLowerCase();
  return (
    normalized === "0" ||
    normalized === "false" ||
    normalized === "no" ||
    normalized === "off"
  );
}
