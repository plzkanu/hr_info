import { getEmployeeAppointments } from "./appointments-store";
import { getEmployeeCareer } from "./career-store";
import { getEmployeesByKeys } from "./employees-store";
import { getEmployeeEducation } from "./education-store";
import { getEmployeeFamily } from "./family-store";
import { HR_CARD_MAX } from "./hr-card";
import { getEmployeeLicenses } from "./licenses-store";
import { getEmployeeMilitary } from "./military-store";
import { getEmployeeRewardPenalty } from "./reward-store";
import { firstNonEmpty } from "./format";
import type { Employee, EmployeeEducation, EmployeeHrCard } from "./types";

export interface EmployeeHrCardKey {
  empNo: string;
  company: string;
}

function withEducationFallback(
  employee: Employee,
  education: EmployeeEducation[],
): EmployeeEducation[] {
  if (education.length === 0) {
    if (
      !employee.lastEducationName &&
      !employee.lastSchoolName &&
      !employee.lastMajorName &&
      !employee.lastMajorFieldName
    ) {
      return [];
    }
    return [
      {
        key: `${employee.id}-roster-edu`,
        careerName: employee.lastEducationName,
        schoolName: employee.lastSchoolName,
        majorName: firstNonEmpty(employee.lastMajorName, employee.lastMajorFieldName),
        majorFieldName: employee.lastMajorFieldName,
        majorCourseName: employee.lastMajorName,
        minorName: "",
        dayNightName: "",
        enterYearMonth: null,
        graduateYearMonth: null,
        degreeName: "",
        location: "",
        isLast: true,
        isApplied: false,
      },
    ];
  }

  return education.map((row) =>
    row.schoolName
      ? row
      : { ...row, schoolName: employee.lastSchoolName },
  );
}

async function buildCard(
  employee: Employee,
): Promise<EmployeeHrCard> {
  const company = employee.companyCode;
  const empNo = employee.empNo;
  const [
    appointments,
    family,
    education,
    career,
    licenses,
    rewards,
    military,
  ] = await Promise.all([
    getEmployeeAppointments(empNo, company),
    getEmployeeFamily(empNo, company),
    getEmployeeEducation(empNo, company),
    getEmployeeCareer(empNo, company),
    getEmployeeLicenses(empNo, company),
    getEmployeeRewardPenalty(empNo, company),
    getEmployeeMilitary(empNo, company),
  ]);

  const byDateAsc = (a: string | null, b: string | null) =>
    (a ?? "").localeCompare(b ?? "");

  return {
    employee,
    appointments: [...appointments].sort((a, b) =>
      byDateAsc(a.orderDate, b.orderDate),
    ),
    family,
    education: withEducationFallback(employee, education).sort((a, b) =>
      byDateAsc(a.graduateYearMonth, b.graduateYearMonth),
    ),
    career: [...career].sort((a, b) => byDateAsc(a.enterDate, b.enterDate)),
    licenses: [...licenses].sort((a, b) =>
      byDateAsc(a.acquireDate, b.acquireDate),
    ),
    rewards: [...rewards].sort((a, b) => byDateAsc(a.fromDate, b.fromDate)),
    military,
  };
}

export async function getEmployeeHrCards(
  keys: EmployeeHrCardKey[],
): Promise<EmployeeHrCard[]> {
  const unique: EmployeeHrCardKey[] = [];
  const seen = new Set<string>();
  for (const key of keys) {
    const empNo = key.empNo.trim();
    const company = key.company.trim();
    if (!empNo || !company) continue;
    const id = `${company}:${empNo}`;
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push({ empNo, company });
  }

  const limited = unique.slice(0, HR_CARD_MAX);
  const employees = await getEmployeesByKeys(limited);
  const cards: EmployeeHrCard[] = [];
  for (const employee of employees) {
    cards.push(await buildCard(employee));
  }
  return cards;
}
