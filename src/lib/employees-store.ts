import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { collectSubDepartmentNames, getAllDepartments } from "./departments";
import {
  calcAge,
  employmentStatusAsOf,
  formatDate,
  isTruthyFlag,
  nationalityLabel,
} from "./format";
import {
  COMPANY_ROSTER_TABLE,
  companiesForFilter,
  isMissingRosterTable,
  parseCompanyFilter,
  type CompanyCode,
  type CompanyFilter,
} from "./companies";
import type {
  Employee,
  EmployeeFilterOptions,
  EmployeeFilters,
} from "./types";

export interface RosterRow {
  emp_id: string;
  emp_name: string | null;
  dept_name: string | null;
  wk_dept_name: string | null;
  dept_full_name: string | null;
  company_name: string | null;
  pos_name: string | null;
  um_jp_name: string | null;
  um_pg_name: string | null;
  um_ps_name: string | null;
  job_name: string | null;
  um_emp_type_name: string | null;
  um_employ_type_name: string | null;
  ent_ret_type_name: string | null;
  ent_ret_name: string | null;
  is_ex_prb: string | null;
  ent_date: string | null;
  retire_date: string | null;
  email: string | null;
  cellphone: string | null;
  phone: string | null;
  resid_id: string | null;
  sm_sex_name: string | null;
  birth_date: string | null;
  sm_birth_type_name: string | null;
  age: number | null;
  age2: number | null;
  emp_eng_name: string | null;
  is_foreigner: string | null;
  remark: string | null;
  photo: string | null;
  wk_yymmdd: string | null;
}

const ROSTER_SELECT = [
  "emp_id",
  "emp_name",
  "dept_name",
  "wk_dept_name",
  "dept_full_name",
  "company_name",
  "pos_name",
  "um_jp_name",
  "um_pg_name",
  "um_ps_name",
  "job_name",
  "um_emp_type_name",
  "um_employ_type_name",
  "ent_ret_type_name",
  "ent_ret_name",
  "is_ex_prb",
  "ent_date",
  "retire_date",
  "email",
  "cellphone",
  "phone",
  "resid_id",
  "sm_sex_name",
  "birth_date",
  "sm_birth_type_name",
  "age",
  "age2",
  "emp_eng_name",
  "is_foreigner",
  "remark",
  "photo",
  "wk_yymmdd",
].join(", ");

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }
}

function mapEmployee(
  row: RosterRow,
  asOfDate: string,
  company: CompanyCode,
): Employee {
  const hireDate = formatDate(row.ent_date) || null;
  const resignDate = formatDate(row.retire_date) || null;
  const birthDate = formatDate(row.birth_date) || null;
  const derivedStatus = employmentStatusAsOf(hireDate, resignDate, asOfDate);
  const storedStatus = (row.ent_ret_name || row.ent_ret_type_name || "").trim();

  return {
    id: `${company}:${row.emp_id}`,
    empNo: row.emp_id,
    name: row.emp_name ?? "",
    englishName: row.emp_eng_name ?? "",
    departmentName: row.dept_name ?? "",
    workDepartmentName: row.wk_dept_name ?? "",
    departmentFullName: row.dept_full_name ?? "",
    companyCode: company,
    companyName: (row.company_name ?? "").trim() || company,
    position: (row.job_name || row.um_ps_name || row.um_jp_name || "").trim(),
    jobGrade: row.um_jp_name ?? "",
    empCategory: row.um_emp_type_name ?? "",
    employType: row.um_employ_type_name ?? "",
    nationalityType: nationalityLabel(row.is_foreigner),
    employmentStatus: derivedStatus || storedStatus,
    hireDate,
    resignDate,
    email: row.email ?? "",
    cellphone: row.cellphone ?? "",
    phone: row.phone ?? "",
    residentId: row.resid_id ?? "",
    gender: row.sm_sex_name ?? "",
    birthDate,
    calendarType: row.sm_birth_type_name ?? "",
    payrollGroup: row.um_pg_name ?? "",
    remarks: row.remark ?? "",
    photoUrl: row.photo ?? "",
    tenure: row.wk_yymmdd ?? "",
    excludeFromHeadcount: isTruthyFlag(row.is_ex_prb),
    age: calcAge(birthDate, asOfDate) ?? row.age ?? row.age2 ?? null,
  };
}

async function searchOneCompany(
  filters: EmployeeFilters,
  company: CompanyCode,
): Promise<{ employees: Employee[]; rosterUnavailable: boolean }> {
  const supabase = createServerClient();
  const table = COMPANY_ROSTER_TABLE[company];
  const asOfDate = filters.asOfDate || new Date().toISOString().slice(0, 10);

  let query = supabase
    .from(table)
    .select(ROSTER_SELECT)
    .order("dept_full_name", { ascending: true })
    .order("emp_id", { ascending: true })
    .limit(10000);

  if (filters.empCategory) {
    query = query.eq("um_emp_type_name", filters.empCategory);
  }
  if (filters.employType) {
    query = query.eq("um_employ_type_name", filters.employType);
  }
  if (filters.empNo) {
    query = query.ilike("emp_id", `%${filters.empNo}%`);
  }
  if (filters.empName) {
    query = query.ilike("emp_name", `%${filters.empName}%`);
  }
  if (filters.hireDateFrom) {
    query = query.gte("ent_date", filters.hireDateFrom);
  }
  if (filters.hireDateTo) {
    query = query.lte("ent_date", filters.hireDateTo);
  }
  if (filters.resignDateFrom) {
    query = query.gte("retire_date", filters.resignDateFrom);
  }
  if (filters.resignDateTo) {
    query = query.lte("retire_date", filters.resignDateTo);
  }
  if (filters.nationalityType === "외국인") {
    query = query.eq("is_foreigner", "1");
  } else if (filters.nationalityType === "내국인") {
    query = query.eq("is_foreigner", "0");
  }
  if (filters.payrollGroup) {
    query = query.eq("um_pg_name", filters.payrollGroup);
  }
  if (filters.englishName) {
    query = query.ilike("emp_eng_name", `%${filters.englishName}%`);
  }
  if (filters.remarks) {
    query = query.ilike("remark", `%${filters.remarks}%`);
  }
  if (!filters.includeExcluded) {
    query = query.neq("is_ex_prb", "1");
  }

  if (filters.departmentName) {
    if (filters.includeSubDepartments) {
      const departments = await getAllDepartments(company);
      const names = collectSubDepartmentNames(
        departments,
        filters.departmentName,
      );
      query = query.in("dept_name", names);
    } else {
      query = query.eq("dept_name", filters.departmentName);
    }
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingRosterTable(error.message)) {
      return { employees: [], rosterUnavailable: true };
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  let rows = ((data ?? []) as unknown as RosterRow[]).map((row) =>
    mapEmployee(row, asOfDate, company),
  );

  if (filters.employmentStatus) {
    rows = rows.filter(
      (row) => row.employmentStatus === filters.employmentStatus,
    );
  } else {
    rows = rows.filter((row) => row.employmentStatus !== "");
  }

  return { employees: rows, rosterUnavailable: false };
}

export async function searchEmployees(
  filters: EmployeeFilters,
): Promise<{ employees: Employee[]; rosterUnavailable: boolean }> {
  requireSupabase();
  const companies = companiesForFilter(parseCompanyFilter(filters.company));
  const results = await Promise.all(
    companies.map((company) => searchOneCompany(filters, company)),
  );

  const available = results.filter((result) => !result.rosterUnavailable);
  if (available.length === 0) {
    return { employees: [], rosterUnavailable: true };
  }

  const employees = available
    .flatMap((result) => result.employees)
    .sort((a, b) => {
      const byCompany = a.companyCode.localeCompare(b.companyCode);
      if (byCompany !== 0) return byCompany;
      const byDept = a.departmentFullName.localeCompare(
        b.departmentFullName,
        "ko",
      );
      if (byDept !== 0) return byDept;
      return a.empNo.localeCompare(b.empNo);
    });

  return { employees, rosterUnavailable: false };
}

const emptyFilterOptions = (): EmployeeFilterOptions => ({
  empCategories: [],
  employTypes: [],
  nationalityTypes: ["내국인", "외국인"],
  employmentStatuses: ["재직자", "퇴직자"],
  payrollGroups: [],
});

function uniqueSorted(values: (string | null | undefined)[]) {
  return [...new Set(values.map((v) => (v ?? "").trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "ko"),
  );
}

async function getFilterOptionsFromTable(
  company: CompanyCode,
): Promise<EmployeeFilterOptions> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from(COMPANY_ROSTER_TABLE[company])
    .select(
      "um_emp_type_name, um_employ_type_name, ent_ret_name, ent_ret_type_name, um_pg_name, is_foreigner",
    )
    .limit(10000);

  if (error) {
    if (isMissingRosterTable(error.message)) {
      return emptyFilterOptions();
    }
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  const rows = (data ?? []) as {
    um_emp_type_name: string | null;
    um_employ_type_name: string | null;
    ent_ret_name: string | null;
    ent_ret_type_name: string | null;
    um_pg_name: string | null;
    is_foreigner: string | null;
  }[];

  return {
    empCategories: uniqueSorted(rows.map((r) => r.um_emp_type_name)),
    employTypes: uniqueSorted(rows.map((r) => r.um_employ_type_name)),
    nationalityTypes: ["내국인", "외국인"],
    employmentStatuses: uniqueSorted([
      ...rows.map((r) => r.ent_ret_name),
      ...rows.map((r) => r.ent_ret_type_name),
      "재직자",
      "퇴직자",
    ]),
    payrollGroups: uniqueSorted(rows.map((r) => r.um_pg_name)),
  };
}

export async function getEmployeeFilterOptions(
  company: CompanyFilter = "",
): Promise<EmployeeFilterOptions> {
  requireSupabase();
  const lists = await Promise.all(
    companiesForFilter(parseCompanyFilter(company)).map((code) =>
      getFilterOptionsFromTable(code),
    ),
  );

  return {
    empCategories: uniqueSorted(lists.flatMap((item) => item.empCategories)),
    employTypes: uniqueSorted(lists.flatMap((item) => item.employTypes)),
    nationalityTypes: ["내국인", "외국인"],
    employmentStatuses: uniqueSorted(
      lists.flatMap((item) => item.employmentStatuses),
    ),
    payrollGroups: uniqueSorted(lists.flatMap((item) => item.payrollGroups)),
  };
}

