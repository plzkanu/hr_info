export const COMPANY_CODES = ["ENS", "IND"] as const;

export type CompanyCode = (typeof COMPANY_CODES)[number];

/** 빈 문자열은 조회조건의 "전체" */
export type CompanyFilter = "" | CompanyCode;

export const COMPANY_ROSTER_TABLE: Record<CompanyCode, string> = {
  ENS: "ens_emp_roster",
  IND: "ind_emp_roster",
};

export const COMPANY_SEQ: Partial<Record<CompanyCode, number>> = {
  ENS: 1,
};

export function parseCompanyFilter(
  value: string | null | undefined,
): CompanyFilter {
  if (value === "ENS" || value === "IND") {
    return value;
  }
  return "";
}

export function companiesForFilter(filter: CompanyFilter): CompanyCode[] {
  return filter ? [filter] : [...COMPANY_CODES];
}

export function isMissingRosterTable(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache") ||
    (normalized.includes("does not exist") &&
      (normalized.includes("ind_emp_roster") ||
        normalized.includes("ens_emp_roster") ||
        normalized.includes("relation")))
  );
}
