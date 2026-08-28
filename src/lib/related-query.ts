import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { getCompanyId } from "./companies-server";

interface FetchRelatedRowsOptions<TRow, TMapped> {
  table: string;
  columns: string;
  empNo: string;
  company?: string;
  order: { column: string; ascending: boolean }[];
  limit?: number;
  map: (row: TRow) => TMapped;
}

export async function fetchRelatedRows<TRow, TMapped>({
  table,
  columns,
  empNo,
  company,
  order,
  limit = 200,
  map,
}: FetchRelatedRowsOptions<TRow, TMapped>): Promise<TMapped[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  const normalizedEmpNo = empNo.trim();
  if (!normalizedEmpNo) {
    return [];
  }

  const supabase = createServerClient();
  let query = supabase.from(table).select(columns).eq("emp_id", normalizedEmpNo);

  const companyId = await getCompanyId(company);
  if (companyId != null) {
    query = query.eq("company_id", companyId);
  }

  for (const item of order) {
    query = query.order(item.column, { ascending: item.ascending });
  }

  const { data, error } = await query.limit(limit);
  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return ((data ?? []) as TRow[]).map(map);
}
