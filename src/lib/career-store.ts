import { fetchRelatedRows } from "./related-query";
import { firstNonEmpty, formatHrDate } from "./format";
import type { EmployeeCareer } from "./types";

interface CareerRow {
  company_seq: number;
  emp_seq: number;
  career_seq: number;
  co_nm: string | null;
  ent_date: string | null;
  ret_date: string | null;
  co_dept_name: string | null;
  jp_name: string | null;
  um_chrg_wk_name: string | null;
  chrg_wk: string | null;
  um_ret_reason_name: string | null;
  um_career_type_name: string | null;
  rem: string | null;
}

function mapCareer(row: CareerRow): EmployeeCareer {
  return {
    key: `${row.company_seq}-${row.emp_seq}-${row.career_seq}`,
    companyName: firstNonEmpty(row.co_nm),
    enterDate: formatHrDate(row.ent_date),
    resignDate: formatHrDate(row.ret_date),
    departmentName: firstNonEmpty(row.co_dept_name),
    positionName: firstNonEmpty(row.jp_name),
    dutyName: firstNonEmpty(row.chrg_wk, row.um_chrg_wk_name),
    resignReasonName: firstNonEmpty(row.um_ret_reason_name),
    careerTypeName: firstNonEmpty(row.um_career_type_name),
    remark: firstNonEmpty(row.rem),
  };
}

export function getEmployeeCareer(empNo: string, company?: string) {
  return fetchRelatedRows<CareerRow, EmployeeCareer>({
    table: "employee_career",
    columns:
      "company_seq, emp_seq, career_seq, co_nm, ent_date, ret_date, co_dept_name, jp_name, um_chrg_wk_name, chrg_wk, um_ret_reason_name, um_career_type_name, rem",
    empNo,
    company,
    order: [
      { column: "ent_date", ascending: false },
      { column: "career_seq", ascending: true },
    ],
    map: mapCareer,
  });
}
