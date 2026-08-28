import { fetchRelatedRows } from "./related-query";
import { firstNonEmpty, formatHrDate } from "./format";
import type { EmployeeMilitary } from "./types";

interface MilitaryRow {
  company_seq: number;
  emp_seq: number;
  um_mil_srv_name: string | null;
  um_mil_kind_name: string | null;
  um_mil_brnch_name: string | null;
  um_mil_spc_name: string | null;
  mil_enrol_date: string | null;
  mil_trans_date: string | null;
}

function mapMilitary(row: MilitaryRow): EmployeeMilitary {
  return {
    key: `${row.company_seq}-${row.emp_seq}`,
    serviceName: firstNonEmpty(row.um_mil_srv_name),
    kindName: firstNonEmpty(row.um_mil_kind_name),
    branchName: firstNonEmpty(row.um_mil_brnch_name),
    specialtyName: firstNonEmpty(row.um_mil_spc_name),
    enrollDate: formatHrDate(row.mil_enrol_date),
    dischargeDate: formatHrDate(row.mil_trans_date),
  };
}

export async function getEmployeeMilitary(
  empNo: string,
  company?: string,
): Promise<EmployeeMilitary[]> {
  try {
    return await fetchRelatedRows<MilitaryRow, EmployeeMilitary>({
      table: "employee_military",
      columns:
        "company_seq, emp_seq, um_mil_srv_name, um_mil_kind_name, um_mil_brnch_name, um_mil_spc_name, mil_enrol_date, mil_trans_date",
      empNo,
      company,
      order: [{ column: "emp_seq", ascending: true }],
      map: mapMilitary,
    });
  } catch {
    return [];
  }
}
