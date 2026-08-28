import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  COMPANY_CODES,
  parseCompanyFilter,
  type CompanyCode,
  type CompanyFilter,
  type CompanyRecord,
} from "./companies";

const FALLBACK_COMPANIES: CompanyRecord[] = [
  { id: 1, code: "IND", name: "IND" },
  { id: 2, code: "ENS", name: "ENS" },
];

let cache: CompanyRecord[] | null = null;
let cacheAt = 0;
const CACHE_MS = 60_000;

export async function getCompanies(): Promise<CompanyRecord[]> {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_MS) {
    return cache;
  }

  if (!isSupabaseConfigured()) {
    cache = FALLBACK_COMPANIES;
    cacheAt = now;
    return cache;
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("soosan_companies")
      .select("id, company_name, is_active")
      .order("id", { ascending: true });

    if (error || !data?.length) {
      cache = FALLBACK_COMPANIES;
    } else {
      const mapped = data
        .filter((row) => row.is_active !== false)
        .map((row) => {
          const code = parseCompanyFilter(String(row.company_name ?? ""));
          return {
            id: Number(row.id),
            code,
            name: code,
          };
        })
        .filter((row) => row.code && Number.isFinite(row.id));
      cache = mapped.length > 0 ? mapped : FALLBACK_COMPANIES;
    }
  } catch {
    cache = FALLBACK_COMPANIES;
  }

  cacheAt = now;
  return cache;
}

/** 상세 테이블 company_id = soosan_companies.id */
export async function getCompanyId(
  company?: string | null,
): Promise<number | undefined> {
  const code = parseCompanyFilter(company);
  if (!code) return undefined;
  const companies = await getCompanies();
  return companies.find((item) => item.code === code)?.id;
}

export async function companiesForFilter(
  filter: CompanyFilter,
): Promise<CompanyCode[]> {
  const companies = await getCompanies();
  const codes = companies.map((item) => item.code);
  const parsed = parseCompanyFilter(filter);
  if (!parsed) {
    return codes.length > 0 ? codes : [...COMPANY_CODES];
  }
  return [parsed];
}
