import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { COMPANY_SEQ, parseCompanyFilter } from "./companies";
import { formatDate, isTruthyFlag } from "./format";
import type { EmployeeFamilyMember } from "./types";

interface FamilyRow {
  company_seq: number;
  emp_seq: number;
  family_seq: number;
  emp_id: string | null;
  family_name: string | null;
  um_rel_name: string | null;
  sm_kin_ship_name: string | null;
  family_resid_id: string | null;
  family_phone: string | null;
  um_sch_career_name: string | null;
  occupation: string | null;
  sm_birth_type_name: string | null;
  birth_date: string | null;
  um_nation_name: string | null;
  is_same_roof: string | null;
  is_death: string | null;
  death_day: string | null;
  is_handi: string | null;
  um_handi_type_name: string | null;
  sm_depend_type_name: string | null;
  is_pay_allow: string | null;
  is_med: string | null;
  disp_seq: number | null;
}

function mapFamily(row: FamilyRow): EmployeeFamilyMember {
  return {
    key: `${row.company_seq}-${row.emp_seq}-${row.family_seq}`,
    empNo: row.emp_id ?? "",
    relationName: row.um_rel_name ?? "",
    kinshipName: row.sm_kin_ship_name ?? "",
    name: row.family_name ?? "",
    residentId: row.family_resid_id ?? "",
    phone: row.family_phone ?? "",
    educationName: row.um_sch_career_name ?? "",
    occupation: row.occupation ?? "",
    birthTypeName: row.sm_birth_type_name ?? "",
    birthDate: formatDate(row.birth_date) || null,
    nationalityName: row.um_nation_name ?? "",
    liveTogether: isTruthyFlag(row.is_same_roof),
    deceased: isTruthyFlag(row.is_death),
    deathDate: formatDate(row.death_day) || null,
    handicapped: isTruthyFlag(row.is_handi),
    handicapTypeName: row.um_handi_type_name ?? "",
    dependTypeName: row.sm_depend_type_name ?? "",
    payAllow: isTruthyFlag(row.is_pay_allow),
    medical: isTruthyFlag(row.is_med),
  };
}

export async function getEmployeeFamily(
  empNo: string,
  company?: string,
): Promise<EmployeeFamilyMember[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  const normalizedEmpNo = empNo.trim();
  if (!normalizedEmpNo) {
    return [];
  }

  const supabase = createServerClient();
  let query = supabase
    .from("employee_family")
    .select(
      "company_seq, emp_seq, family_seq, emp_id, family_name, um_rel_name, sm_kin_ship_name, family_resid_id, family_phone, um_sch_career_name, occupation, sm_birth_type_name, birth_date, um_nation_name, is_same_roof, is_death, death_day, is_handi, um_handi_type_name, sm_depend_type_name, is_pay_allow, is_med, disp_seq",
    )
    .eq("emp_id", normalizedEmpNo)
    .order("disp_seq", { ascending: true, nullsFirst: false })
    .order("family_seq", { ascending: true })
    .limit(200);

  const companyFilter = parseCompanyFilter(company);
  const companySeq = companyFilter ? COMPANY_SEQ[companyFilter] : undefined;
  if (companySeq != null) {
    query = query.eq("company_seq", companySeq);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return ((data ?? []) as FamilyRow[]).map(mapFamily);
}
