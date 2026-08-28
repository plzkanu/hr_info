import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import { getCompanyId } from "./companies-server";
import { formatDate } from "./format";
import type { EmployeeAppointment } from "./types";

interface AppointmentRow {
  company_seq: number;
  emp_seq: number;
  sm_source_type: number;
  int_seq: number;
  emp_id: string | null;
  emp_name: string | null;
  sm_source_type_name: string | null;
  ord_name: string | null;
  ord_date: string | null;
  ord_end_date: string | null;
  dept_name: string | null;
  ord_dept_name: string | null;
  pos_name: string | null;
  um_jp_name: string | null;
  um_jd_name: string | null;
  um_ps_name: string | null;
  um_jo_name: string | null;
  job_name: string | null;
  um_pg_name: string | null;
  um_ws_name: string | null;
  contents: string | null;
  remark: string | null;
  is_last: string | null;
  is_wk_ord: string | null;
}

function isOpenEndedDate(value: string | null | undefined) {
  const digits = (value ?? "").replace(/[^0-9]/g, "");
  return digits === "99991231" || digits === "99999999";
}

function mapAppointment(row: AppointmentRow): EmployeeAppointment {
  const endRaw = row.ord_end_date ?? "";
  return {
    key: `${row.company_seq}-${row.emp_seq}-${row.sm_source_type}-${row.int_seq}`,
    empNo: row.emp_id ?? "",
    empName: row.emp_name ?? "",
    sourceTypeName: row.sm_source_type_name ?? "",
    orderName: row.ord_name ?? "",
    orderDate: formatDate(row.ord_date) || null,
    orderEndDate: isOpenEndedDate(endRaw) ? null : formatDate(endRaw) || null,
    departmentName: row.dept_name ?? "",
    orderDepartmentName: row.ord_dept_name || row.dept_name || "",
    positionName: row.pos_name ?? "",
    jobGradeName: row.um_jp_name ?? "",
    jobRankName: row.um_ps_name ?? "",
    jobDutyName: row.um_jd_name ?? "",
    jobTypeName: row.um_jo_name ?? "",
    jobName: row.job_name ?? "",
    payrollGroupName: row.um_pg_name ?? "",
    workStatusName: row.um_ws_name ?? "",
    contents: row.contents ?? "",
    remark: row.remark ?? "",
    isLast: row.is_last === "1",
    isWorkOrder: row.is_wk_ord === "1",
  };
}

export async function getEmployeeAppointments(
  empNo: string,
  company?: string,
): Promise<EmployeeAppointment[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  const normalizedEmpNo = empNo.trim();
  if (!normalizedEmpNo) {
    return [];
  }

  const supabase = createServerClient();
  let query = supabase
    .from("employee_appointments")
    .select(
      "company_seq, emp_seq, sm_source_type, int_seq, emp_id, emp_name, sm_source_type_name, ord_name, ord_date, ord_end_date, dept_name, ord_dept_name, pos_name, um_jp_name, um_jd_name, um_ps_name, um_jo_name, job_name, um_pg_name, um_ws_name, contents, remark, is_last, is_wk_ord",
    )
    .eq("emp_id", normalizedEmpNo)
    .order("ord_date", { ascending: false })
    .order("int_seq", { ascending: false })
    .limit(500);

  const companyId = await getCompanyId(company);
  if (companyId != null) {
    query = query.eq("company_id", companyId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return ((data ?? []) as AppointmentRow[]).map(mapAppointment);
}
