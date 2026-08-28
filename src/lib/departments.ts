import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchAllRows, formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import {
  COMPANY_ROSTER_TABLE,
  isMissingRosterTable,
  parseCompanyFilter,
  rosterTableFor,
  type CompanyCode,
  type CompanyFilter,
} from "./companies";
import { companiesForFilter } from "./companies-server";
import type { Department } from "./types";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }
}

async function getDepartmentsFromTable(
  company: CompanyCode,
): Promise<Department[]> {
  const supabase = createServerClient();
  const { data, error } = await fetchAllRows<{
    dept_name: string | null;
    dept_full_name: string | null;
  }>((from, to) =>
    supabase
      .from(COMPANY_ROSTER_TABLE[company] ?? rosterTableFor(company))
      .select("dept_name, dept_full_name, emp_id")
      .order("emp_id", { ascending: true })
      .range(from, to),
  );

  if (error) {
    if (isMissingRosterTable(error.message)) {
      return [];
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  const byName = new Map<string, Department>();
  for (const row of data ?? []) {
    const name = (row.dept_name as string | null)?.trim() ?? "";
    if (!name) continue;
    const fullName = (row.dept_full_name as string | null)?.trim() || name;
    const prev = byName.get(name);
    if (!prev || fullName.length > prev.fullName.length) {
      byName.set(name, { name, fullName });
    }
  }
  return [...byName.values()];
}

export async function getAllDepartments(
  company: CompanyFilter = "",
): Promise<Department[]> {
  requireSupabase();
  const filter = parseCompanyFilter(company);
  const lists = await Promise.all(
    (await companiesForFilter(filter)).map((code) =>
      getDepartmentsFromTable(code),
    ),
  );

  const byName = new Map<string, Department>();
  for (const dept of lists.flat()) {
    const prev = byName.get(dept.name);
    if (!prev || dept.fullName.length > prev.fullName.length) {
      byName.set(dept.name, dept);
    }
  }

  return [...byName.values()].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "ko"),
  );
}

export function collectSubDepartmentNames(
  departments: Department[],
  selectedName: string,
): string[] {
  const selected = departments.find((dept) => dept.name === selectedName);
  if (!selected) return [selectedName];

  const names = new Set<string>([selectedName]);
  const prefix = `${selected.fullName}\\`;
  for (const dept of departments) {
    if (dept.fullName === selected.fullName || dept.fullName.startsWith(prefix)) {
      names.add(dept.name);
    }
  }
  return [...names];
}
