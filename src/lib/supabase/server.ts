import "server-only";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  getManmanageConfigError,
  getSupabaseConfigError,
  isManmanageConfigured,
  isSupabaseConfigured,
} from "./config";
import { getSupabaseFetch } from "./fetch";

function envValue(name: string): string {
  return (process.env[name] ?? "").trim();
}

function createConfiguredClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: getSupabaseFetch(),
    },
  });
}

/** hr_info 프로젝트. 로그인 계정·앱 설정·회사구분 */
export function createServerClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(getSupabaseConfigError() ?? "Supabase 설정이 없습니다.");
  }

  return createConfiguredClient(
    envValue("NEXT_PUBLIC_SUPABASE_URL"),
    envValue("SUPABASE_SERVICE_ROLE_KEY"),
  );
}

/** manmanage 프로젝트. 사원명부·발령 등 인사 원천 테이블 */
export function createManmanageClient(): SupabaseClient {
  if (!isManmanageConfigured()) {
    throw new Error(
      getManmanageConfigError() ?? "manmanage Supabase 설정이 없습니다.",
    );
  }

  return createConfiguredClient(
    envValue("MANMANAGE_SUPABASE_URL"),
    envValue("MANMANAGE_SUPABASE_SERVICE_ROLE_KEY"),
  );
}

/** 인사 데이터 조회. manmanage 키가 있으면 그쪽, 없으면 기존 hr_info */
export function createHrDataClient(): SupabaseClient {
  if (isManmanageConfigured()) {
    return createManmanageClient();
  }
  return createServerClient();
}
