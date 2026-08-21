import { fetchRelatedRows } from "./related-query";
import { firstNonEmpty, formatHrDate, isTruthyFlag } from "./format";
import type { EmployeeLicense } from "./types";

interface LicenseRow {
  company_seq: number;
  emp_seq: number;
  license_seq: number;
  um_lic_name: string | null;
  etc_lic_name: string | null;
  um_lic_group_name: string | null;
  issue_inst: string | null;
  lic_no: string | null;
  acq_date: string | null;
  val_date: string | null;
  um_auth_type_name: string | null;
  score: number | null;
  is_allow_pay: string | null;
  is_law: string | null;
  rem: string | null;
}

function mapLicense(row: LicenseRow): EmployeeLicense {
  const score = row.score == null ? null : Number(row.score);
  return {
    key: `${row.company_seq}-${row.emp_seq}-${row.license_seq}`,
    licenseName: firstNonEmpty(row.um_lic_name, row.etc_lic_name),
    groupName: firstNonEmpty(row.um_lic_group_name),
    issueInstitution: firstNonEmpty(row.issue_inst),
    licenseNo: firstNonEmpty(row.lic_no),
    acquireDate: formatHrDate(row.acq_date),
    validDate: formatHrDate(row.val_date),
    authTypeName: firstNonEmpty(row.um_auth_type_name),
    score: score && score !== 0 ? score : null,
    allowPay: isTruthyFlag(row.is_allow_pay),
    statutory: isTruthyFlag(row.is_law),
    remark: firstNonEmpty(row.rem),
  };
}

export function getEmployeeLicenses(empNo: string, company?: string) {
  return fetchRelatedRows<LicenseRow, EmployeeLicense>({
    table: "employee_licenses",
    columns:
      "company_seq, emp_seq, license_seq, um_lic_name, etc_lic_name, um_lic_group_name, issue_inst, lic_no, acq_date, val_date, um_auth_type_name, score, is_allow_pay, is_law, rem",
    empNo,
    company,
    order: [
      { column: "acq_date", ascending: false },
      { column: "license_seq", ascending: true },
    ],
    map: mapLicense,
  });
}
