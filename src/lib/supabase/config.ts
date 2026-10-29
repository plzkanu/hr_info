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

/** 사원명부·발령 등. hr_info Supabase가 필요합니다. */
export function isHrDataConfigured() {
  return isSupabaseConfigured();
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

function tlsVerifyDisabledInEnv(): boolean {
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

/** 운영(NODE_ENV=production)에서는 인증서 검증을 우회하지 않습니다. */
export function isSupabaseTlsInsecure(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return tlsVerifyDisabledInEnv();
}

export function warnIfProductionTlsBypassRequested() {
  if (process.env.NODE_ENV !== "production") return;
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (tlsVerifyDisabledInEnv()) {
    console.warn(
      "[tls] 운영에서 SUPABASE_SSL_VERIFY 우회 설정은 무시합니다. 인증서를 검증합니다.",
    );
  }
}
