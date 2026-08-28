/** UI 기본값. 실제 목록은 soosan_companies를 우선합니다. */
export const COMPANY_CODES = ["ENS", "IND"] as const;

export type CompanyCode = string;
export type CompanyFilter = string;

export interface CompanyRecord {
  id: number;
  code: string;
  name: string;
}

export function rosterTableFor(code: string): string {
  return `${code.trim().toLowerCase()}_emp_roster`;
}

export const COMPANY_ROSTER_TABLE: Record<string, string> = {
  ENS: "ens_emp_roster",
  IND: "ind_emp_roster",
};

function normalizeCode(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

export function parseCompanyFilter(
  value: string | null | undefined,
): CompanyFilter {
  return normalizeCode(value);
}

export function isMissingRosterTable(message: string): boolean {
  const normalized = message.toLowerCase();
  if (normalized.includes("column")) {
    return false;
  }
  return (
    normalized.includes("could not find the table") ||
    (normalized.includes("schema cache") &&
      (normalized.includes("ind_emp_roster") ||
        normalized.includes("ens_emp_roster") ||
        normalized.includes("soosan_companies"))) ||
    (normalized.includes("does not exist") &&
      (normalized.includes("ind_emp_roster") ||
        normalized.includes("ens_emp_roster") ||
        normalized.includes("soosan_companies") ||
        normalized.includes("relation")))
  );
}
