export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed.slice(0, 10);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isOpenEndedDate(value: string | null | undefined) {
  const digits = (value ?? "").replace(/[^0-9]/g, "");
  return digits === "99991231" || digits === "99999999";
}

export function formatHrDate(value: string | null | undefined): string | null {
  if (isOpenEndedDate(value)) return null;
  return formatDate(value) || null;
}

export function formatYearMonth(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^0-9]/g, "");
  if (digits.length >= 8) return formatHrDate(digits.slice(0, 8));
  if (digits.length >= 6) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
  if (digits.length === 4) return digits;
  return trimmed;
}

export function firstNonEmpty(
  ...values: (string | null | undefined)[]
): string {
  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

export function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function calcAge(
  birthDate: string | null | undefined,
  asOfDate: string,
): number | null {
  const birth = formatDate(birthDate);
  if (!birth) return null;
  const [by, bm, bd] = birth.split("-").map(Number);
  const [ay, am, ad] = formatDate(asOfDate).split("-").map(Number);
  if (!by || !ay) return null;
  let age = ay - by;
  if ((am ?? 0) < (bm ?? 0) || ((am ?? 0) === (bm ?? 0) && (ad ?? 0) < (bd ?? 0))) {
    age -= 1;
  }
  return age < 0 ? null : age;
}

/** 주민등록번호 마스킹: 앞 7자리만 표시 */
export function maskResidentId(value: string): string {
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length < 7) {
    if (!value) return "";
    return value.slice(0, 8) + "******";
  }
  return `${digits.slice(0, 6)}-${digits.slice(6, 7)}******`;
}

export function formatResidentId(value: string, revealFull: boolean): string {
  if (!revealFull) {
    return maskResidentId(value);
  }
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length >= 13) {
    return `${digits.slice(0, 6)}-${digits.slice(6, 13)}`;
  }
  if (digits.length > 6) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  }
  return digits || value;
}

export function employmentStatusAsOf(
  hireDate: string | null,
  resignDate: string | null,
  asOfDate: string,
): "재직자" | "퇴직자" | "" {
  const hire = formatDate(hireDate);
  const resign = formatDate(resignDate);
  if (hire && hire > asOfDate) return "";
  if (resign && resign <= asOfDate) return "퇴직자";
  return "재직자";
}

export function isTruthyFlag(value: string | null | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "y" || normalized === "true";
}

export function nationalityLabel(isForeigner: string | null | undefined): string {
  return isTruthyFlag(isForeigner) ? "외국인" : "내국인";
}
