import { fetchRelatedRows } from "./related-query";
import { firstNonEmpty, formatHrDate, isTruthyFlag } from "./format";
import type { EmployeeLanguage } from "./types";

interface LanguageRow {
  company_seq: number;
  emp_seq: number;
  linguistic_seq: number;
  um_language_type_name: string | null;
  um_auth_type_name: string | null;
  score: number | null;
  um_grade_name: string | null;
  beg_date: string | null;
  end_date: string | null;
  is_allow_pay: string | null;
  remark: string | null;
}

function mapLanguage(row: LanguageRow): EmployeeLanguage {
  return {
    key: `${row.company_seq}-${row.emp_seq}-${row.linguistic_seq}`,
    languageName: firstNonEmpty(row.um_language_type_name),
    authTypeName: firstNonEmpty(row.um_auth_type_name),
    score: row.score == null ? null : Number(row.score),
    gradeName: firstNonEmpty(row.um_grade_name),
    beginDate: formatHrDate(row.beg_date),
    endDate: formatHrDate(row.end_date),
    allowPay: isTruthyFlag(row.is_allow_pay),
    remark: firstNonEmpty(row.remark),
  };
}

export function getEmployeeLanguages(empNo: string, company?: string) {
  return fetchRelatedRows<LanguageRow, EmployeeLanguage>({
    table: "employee_languages",
    columns:
      "company_seq, emp_seq, linguistic_seq, um_language_type_name, um_auth_type_name, score, um_grade_name, beg_date, end_date, is_allow_pay, remark",
    empNo,
    company,
    order: [
      { column: "beg_date", ascending: false },
      { column: "linguistic_seq", ascending: true },
    ],
    map: mapLanguage,
  });
}
