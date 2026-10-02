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

/** manmanage 프로젝트. 공사경력 등 manmanage 전용 테이블 */
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

/** 사원명부·발령·가족 등. ens_emp_roster 는 hr_info에 있습니다. */
export function createHrDataClient(): SupabaseClient {
  return createServerClient();
}
