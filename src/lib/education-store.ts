import { fetchRelatedRows } from "./related-query";
import { firstNonEmpty, formatYearMonth, isTruthyFlag } from "./format";
import type { EmployeeEducation } from "./types";

interface EducationRow {
  company_seq: number;
  emp_seq: number;
  academic_seq: number;
  um_sch_career_name: string | null;
  um_sch_name: string | null;
  etc_sch_nm: string | null;
  um_major_depart_name: string | null;
  um_major_course_name: string | null;
  major_course: string | null;
  um_minor_depart_name: string | null;
  um_minor_course_name: string | null;
  minor_course: string | null;
  sm_day_night_type_name: string | null;
  ent_ym: string | null;
  grd_ym: string | null;
  um_degree_type_name: string | null;
  sm_degree_type_name: string | null;
  loc: string | null;
  is_last_sch_career: string | null;
  is_app_sch_career: string | null;
}

function mapEducation(row: EducationRow): EmployeeEducation {
  return {
    key: `${row.company_seq}-${row.emp_seq}-${row.academic_seq}`,
    careerName: firstNonEmpty(row.um_sch_career_name),
    schoolName: firstNonEmpty(row.um_sch_name, row.etc_sch_nm),
    majorName: firstNonEmpty(
      row.um_major_course_name,
      row.major_course,
      row.um_major_depart_name,
    ),
    minorName: firstNonEmpty(
      row.um_minor_course_name,
      row.minor_course,
      row.um_minor_depart_name,
    ),
    dayNightName: firstNonEmpty(row.sm_day_night_type_name),
    enterYearMonth: formatYearMonth(row.ent_ym),
    graduateYearMonth: formatYearMonth(row.grd_ym),
    degreeName: firstNonEmpty(row.um_degree_type_name, row.sm_degree_type_name),
    location: firstNonEmpty(row.loc),
    isLast: isTruthyFlag(row.is_last_sch_career),
    isApplied: isTruthyFlag(row.is_app_sch_career),
  };
}

export function getEmployeeEducation(empNo: string, company?: string) {
  return fetchRelatedRows<EducationRow, EmployeeEducation>({
    table: "employee_education",
    columns:
      "company_seq, emp_seq, academic_seq, um_sch_career_name, um_sch_name, etc_sch_nm, um_major_depart_name, um_major_course_name, major_course, um_minor_depart_name, um_minor_course_name, minor_course, sm_day_night_type_name, ent_ym, grd_ym, um_degree_type_name, sm_degree_type_name, loc, is_last_sch_career, is_app_sch_career, disp_seq",
    empNo,
    company,
    order: [
      { column: "disp_seq", ascending: true },
      { column: "grd_ym", ascending: false },
      { column: "academic_seq", ascending: true },
    ],
    map: mapEducation,
  });
}
