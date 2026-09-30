import { createManmanageClient } from "@/lib/supabase/server";
import { isManmanageConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import {
  firstNonEmpty,
  formatYearMonth,
  formatYearMonthDuration,
  monthsBetweenYearMonths,
  parseDurationToMonths,
} from "./format";
import type { EmployeeConstructionHistory } from "./types";

interface ConstructionHistoryRow {
  id: number;
  employee_id: number;
  duty1: string | null;
  duty2: string | null;
  notes: string | null;
  power_plant: string | null;
  client: string | null;
  field: string | null;
  construction_type: string | null;
  start_date: string | null;
  end_date: string | null;
  duration: string | null;
  position: string | null;
  project_name: string | null;
  location: string | null;
  recognition_percentage: number | null;
  company: string | null;
  work_description: string | null;
}

const EMP_NO_COLUMNS = [
  "emp_no",
  "emp_id",
  "employee_no",
  "employee_number",
  "code",
] as const;

let cachedEmpNoColumn: string | null = null;

function isMissingColumn(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("column") ||
    normalized.includes("schema cache") ||
    normalized.includes("does not exist") ||
    normalized.includes("could not find")
  );
}

function resolveDurationMonths(row: ConstructionHistoryRow): number {
  const fromText = parseDurationToMonths(row.duration);
  if (fromText != null) {
    const ratio =
      row.recognition_percentage == null ||
      Number.isNaN(Number(row.recognition_percentage))
        ? 1
        : Number(row.recognition_percentage) / 100;
    return Math.round(fromText * ratio);
  }
  return monthsBetweenYearMonths(row.start_date, row.end_date) ?? 0;
}

function mapRow(row: ConstructionHistoryRow): EmployeeConstructionHistory {
  const durationMonths = resolveDurationMonths(row);
  return {
    key: String(row.id),
    client: firstNonEmpty(row.client),
    powerPlant: firstNonEmpty(row.power_plant),
    constructionType: firstNonEmpty(row.construction_type),
    field: firstNonEmpty(row.field),
    position: firstNonEmpty(row.position),
    duty1: firstNonEmpty(row.duty1),
    duty2: firstNonEmpty(row.duty2),
    startDate: formatYearMonth(row.start_date),
    endDate: formatYearMonth(row.end_date),
    duration: firstNonEmpty(row.duration) || formatYearMonthDuration(durationMonths),
    durationMonths,
    notes: firstNonEmpty(row.notes),
  };
}

async function resolveEmpNoColumn(): Promise<string> {
  if (cachedEmpNoColumn) return cachedEmpNoColumn;

  const supabase = createManmanageClient();
  for (const column of EMP_NO_COLUMNS) {
    const { error } = await supabase.from("employee").select(`id, ${column}`).limit(1);
    if (!error) {
      cachedEmpNoColumn = column;
      return column;
    }
    if (!isMissingColumn(error.message)) {
      throw new Error(formatSupabaseNetworkError(error.message));
    }
  }

  throw new Error(
    "manmanage employee 테이블에서 사번 컬럼을 찾지 못했습니다.",
  );
}

async function findEmployeeIds(empNo: string): Promise<number[]> {
  const column = await resolveEmpNoColumn();
  const supabase = createManmanageClient();
  const values = [empNo];
  const stripped = empNo.replace(/^0+/, "");
  if (stripped && stripped !== empNo) values.push(stripped);
  if (/^\d+$/.test(empNo)) values.push(String(Number(empNo)));

  const uniqueValues = [...new Set(values)];
  const ids = new Set<number>();

  for (const value of uniqueValues) {
    const { data, error } = await supabase
      .from("employee")
      .select("id")
      .eq(column, value)
      .limit(20);
    if (error) {
      throw new Error(formatSupabaseNetworkError(error.message));
    }
    for (const row of data ?? []) {
      const id = Number((row as { id: number }).id);
      if (Number.isFinite(id)) ids.add(id);
    }
  }

  return [...ids];
}

export async function getEmployeeConstructionHistory(
  empNo: string,
  _company?: string,
): Promise<EmployeeConstructionHistory[]> {
  if (!isManmanageConfigured()) {
    throw new Error(
      "manmanage 설정이 없습니다. .env.local에 MANMANAGE_SUPABASE_SERVICE_ROLE_KEY를 넣으세요.",
    );
  }

  const normalizedEmpNo = empNo.trim();
  if (!normalizedEmpNo) return [];

  const employeeIds = await findEmployeeIds(normalizedEmpNo);
  if (employeeIds.length === 0) return [];

  const supabase = createManmanageClient();
  const { data, error } = await supabase
    .from("employee_construction_history")
    .select(
      "id, employee_id, duty1, duty2, notes, power_plant, client, field, construction_type, start_date, end_date, duration, position, project_name, location, recognition_percentage, company, work_description",
    )
    .in("employee_id", employeeIds)
    .order("start_date", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .limit(500);

  if (error) {
    throw new Error(formatSupabaseNetworkError(error.message));
  }

  return ((data ?? []) as ConstructionHistoryRow[]).map(mapRow);
}
