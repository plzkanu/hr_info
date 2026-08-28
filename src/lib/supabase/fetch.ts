import { Agent, fetch as undiciFetch } from "undici";
import { isSupabaseTlsInsecure } from "./config";

/** PostgREST 기본 max-rows(1000)를 넘기려면 range 페이징이 필요합니다. */
export const SUPABASE_PAGE_SIZE = 1000;

export async function fetchAllRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = [];
  let from = 0;
  while (from < 100_000) {
    const { data, error } = await fetchPage(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error) {
      return { data: all, error };
    }
    const rows = (data ?? []) as T[];
    all.push(...rows);
    if (rows.length < SUPABASE_PAGE_SIZE) {
      break;
    }
    from += SUPABASE_PAGE_SIZE;
  }
  return { data: all, error: null };
}

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
      "Supabase에 필요한 테이블이 없습니다. 사원명부는 ens_emp_roster / ind_emp_roster, " +
      "회사구분은 soosan_companies, 로그인 계정은 employee_users, 인사상세는 employee_appointments / " +
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

let insecureFetch: typeof globalThis.fetch | null = null;

/**
 * SUPABASE_SSL_VERIFY=0 일 때 인증서 검증만 생략합니다.
 * NODE_TLS_REJECT_UNAUTHORIZED 를 바꾸면 Next.js가 경고를 페이지 에러로 띄웁니다.
 */
export function getSupabaseFetch(): typeof globalThis.fetch {
  if (!isSupabaseTlsInsecure()) {
    return globalThis.fetch.bind(globalThis);
  }
  if (insecureFetch) {
    return insecureFetch;
  }

  const dispatcher = new Agent({
    connect: { rejectUnauthorized: false },
  });

  insecureFetch = ((input: RequestInfo | URL, init?: RequestInit) =>
    undiciFetch(input as Parameters<typeof undiciFetch>[0], {
      ...(init as object),
      dispatcher,
    })) as unknown as typeof globalThis.fetch;

  return insecureFetch;
}
