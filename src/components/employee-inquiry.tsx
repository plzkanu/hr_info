"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { EmployeeDetailModal } from "@/components/employee-detail-modal";
import { EmployeeHrCardPrint } from "@/components/employee-hr-card-print";
import { todayIsoDate } from "@/lib/format";
import { COMPANY_CODES, parseCompanyFilter, rosterTableFor, type CompanyFilter } from "@/lib/companies";
import { hrApi } from "@/lib/hr-api";
import { HR_CARD_MAX } from "@/lib/hr-card";
import type {
  Department,
  Employee,
  EmployeeFilterOptions,
  EmployeeHrCard,
} from "@/lib/types";

const inputClass =
  "min-w-0 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-[#009ada] focus:ring-1 focus:ring-[#009ada]/20";
const labelClass = "mb-1 block text-[11px] font-medium text-slate-600";

type SortKey =
  | "companyCode"
  | "departmentName"
  | "position"
  | "jobGrade"
  | "name"
  | "hireDate"
  | "resignDate"
  | "email"
  | "empNo"
  | "empCategory"
  | "employmentStatus"
  | "residentId"
  | "gender"
  | "birthDate"
  | "calendarType"
  | "age";

type SortDir = "asc" | "desc";

interface SortRule {
  key: SortKey;
  dir: SortDir;
}

function sortValue(emp: Employee, key: SortKey): string | number {
  const value = emp[key];
  if (value == null) return "";
  return value;
}

function compareSortValues(a: string | number, b: string | number): number {
  if (a === "" && b === "") return 0;
  if (a === "") return 1;
  if (b === "") return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "ko", {
    numeric: true,
    sensitivity: "base",
  });
}

function nextSorts(prev: SortRule[], key: SortKey): SortRule[] {
  const index = prev.findIndex((rule) => rule.key === key);
  if (index < 0) return [...prev, { key, dir: "asc" }];
  if (prev[index].dir === "asc") {
    return prev.map((rule, i) => (i === index ? { ...rule, dir: "desc" } : rule));
  }
  return prev.filter((_, i) => i !== index);
}

const SORT_POPUP_MIN_MS = 2000;

function SortableTh({
  label,
  sortKey,
  sorts,
  onToggle,
}: {
  label: string;
  sortKey: SortKey;
  sorts: SortRule[];
  onToggle: (key: SortKey) => void;
}) {
  const index = sorts.findIndex((rule) => rule.key === sortKey);
  const rule = index >= 0 ? sorts[index] : null;
  return (
    <th
      className="select-none whitespace-nowrap px-1.5 py-2 font-medium"
      onDoubleClick={(event) => {
        event.preventDefault();
        onToggle(sortKey);
      }}
      title="더블클릭: 오름차순 → 내림차순 → 정렬 해제"
    >
      <span className="inline-flex cursor-pointer items-center gap-0.5 hover:text-slate-700">
        {label}
        {rule ? (
          <span className="text-[#004b87]">
            {rule.dir === "asc" ? "▲" : "▼"}
            {sorts.length > 1 ? (
              <span className="ml-px text-[9px]">{index + 1}</span>
            ) : null}
          </span>
        ) : null}
      </span>
    </th>
  );
}

interface FilterState {
  company: CompanyFilter;
  asOfDate: string;
  empCategory: string;
  employType: string;
  empNo: string;
  empName: string;
  hireDateFrom: string;
  hireDateTo: string;
  resignDateFrom: string;
  resignDateTo: string;
  nationalityType: string;
  employmentStatus: string;
  departmentName: string;
  includeSubDepartments: boolean;
  position: string;
  jobGrade: string;
  gender: string;
  payrollGroup: string;
  englishName: string;
  remarks: string;
  includeExcluded: boolean;
}

const emptyFilters = (): FilterState => ({
  company: "",
  asOfDate: todayIsoDate(),
  empCategory: "",
  employType: "",
  empNo: "",
  empName: "",
  hireDateFrom: "",
  hireDateTo: "",
  resignDateFrom: "",
  resignDateTo: "",
  nationalityType: "",
  employmentStatus: "재직자",
  departmentName: "",
  includeSubDepartments: false,
  position: "",
  jobGrade: "",
  gender: "",
  payrollGroup: "",
  englishName: "",
  remarks: "",
  includeExcluded: true,
});

function toQuery(filters: FilterState): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string) => {
    if (value) params.set(key, value);
  };
  set("company", filters.company);
  set("asOfDate", filters.asOfDate);
  set("empCategory", filters.empCategory);
  set("employType", filters.employType);
  set("empNo", filters.empNo);
  set("empName", filters.empName);
  set("hireDateFrom", filters.hireDateFrom);
  set("hireDateTo", filters.hireDateTo);
  set("resignDateFrom", filters.resignDateFrom);
  set("resignDateTo", filters.resignDateTo);
  set("nationalityType", filters.nationalityType);
  set("employmentStatus", filters.employmentStatus);
  set("departmentName", filters.departmentName);
  set("position", filters.position);
  set("jobGrade", filters.jobGrade);
  set("gender", filters.gender);
  set("payrollGroup", filters.payrollGroup);
  set("englishName", filters.englishName);
  set("remarks", filters.remarks);
  if (filters.includeSubDepartments) params.set("includeSubDepartments", "1");
  if (filters.includeExcluded) params.set("includeExcluded", "1");
  return params.toString();
}

export function EmployeeInquiry() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [draft, setDraft] = useState<FilterState>(emptyFilters);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [options, setOptions] = useState<EmployeeFilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Employee | null>(null);
  const [rosterUnavailable, setRosterUnavailable] = useState(false);
  const [hrCards, setHrCards] = useState<EmployeeHrCard[]>([]);
  const [hrCardBusy, setHrCardBusy] = useState(false);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [sortBusy, setSortBusy] = useState(false);
  const [sortTick, setSortTick] = useState(0);
  const printAfterRender = useRef(false);
  const sortStartedAt = useRef(0);
  const sortDeferTimer = useRef<number | null>(null);

  const loadMeta = useCallback(async (company: CompanyFilter) => {
    const [deptRes, optRes] = await Promise.all([
      fetch(`${hrApi("/departments")}?company=${company}`),
      fetch(`${hrApi("/employees")}?meta=1&company=${company}`),
    ]);
    const deptData = (await deptRes.json()) as {
      departments?: Department[];
      error?: string;
    };
    const optData = (await optRes.json()) as {
      options?: EmployeeFilterOptions;
      error?: string;
    };
    if (deptRes.ok) setDepartments(deptData.departments ?? []);
    if (optRes.ok && optData.options) setOptions(optData.options);
  }, []);

  const loadEmployees = useCallback(async (nextFilters: FilterState) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`${hrApi("/employees")}?${toQuery(nextFilters)}`);
      const data = (await response.json()) as {
        employees?: Employee[];
        error?: string;
        rosterUnavailable?: boolean;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "사원 목록을 불러오지 못했습니다.");
      }
      setEmployees(data.employees ?? []);
      setRosterUnavailable(data.rosterUnavailable === true);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = emptyFilters();
    void loadMeta(initial.company);
    void loadEmployees(initial);
  }, [loadMeta, loadEmployees]);

  function patchDraft<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleCompanyChange(value: string) {
    const company = parseCompanyFilter(value);
    setDraft((prev) => ({
      ...prev,
      company,
      departmentName: "",
      empCategory: "",
      position: "",
      jobGrade: "",
      gender: "",
    }));
    void loadMeta(company);
  }

  function handleSearch(event?: FormEvent) {
    event?.preventDefault();
    const next = { ...draft };
    setFilters(next);
    void loadEmployees(next);
  }

  function handleReset() {
    const next = emptyFilters();
    setDraft(next);
    setFilters(next);
    void loadMeta(next.company);
    void loadEmployees(next);
    setSorts([]);
    setSortBusy(false);
  }

  const allSelected = useMemo(
    () => employees.length > 0 && employees.every((e) => selectedIds.has(e.id)),
    [employees, selectedIds],
  );

  const companyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const emp of employees) {
      if (!emp.companyCode) continue;
      counts.set(emp.companyCode, (counts.get(emp.companyCode) ?? 0) + 1);
    }
    const codes = [...new Set(["IND", "ENS", ...counts.keys()])];
    return codes.map((code) => ({
      code,
      count: counts.get(code) ?? 0,
    }));
  }, [employees]);

  const sortedEmployees = useMemo(() => {
    if (sorts.length === 0) return employees;
    return [...employees].sort((a, b) => {
      for (const { key, dir } of sorts) {
        const cmp = compareSortValues(sortValue(a, key), sortValue(b, key));
        if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }, [employees, sorts]);

  function toggleSort(key: SortKey) {
    setSortBusy(true);
    sortStartedAt.current = Date.now();
    if (sortDeferTimer.current != null) {
      window.clearTimeout(sortDeferTimer.current);
    }
    sortDeferTimer.current = window.setTimeout(() => {
      sortDeferTimer.current = null;
      setSorts((prev) => nextSorts(prev, key));
      setSortTick((n) => n + 1);
    }, 50);
  }

  useEffect(() => {
    if (sortTick === 0) return;
    const remaining = Math.max(
      0,
      SORT_POPUP_MIN_MS - (Date.now() - sortStartedAt.current),
    );
    const timer = window.setTimeout(() => setSortBusy(false), remaining);
    return () => window.clearTimeout(timer);
  }, [sortTick]);

  useEffect(() => {
    return () => {
      if (sortDeferTimer.current != null) {
        window.clearTimeout(sortDeferTimer.current);
      }
    };
  }, []);

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(employees.map((e) => e.id)));
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exportExcel() {
    const rows = sortedEmployees.map((e, index) => ({
      번호: index + 1,
      회사: e.companyCode,
      부서: e.departmentName,
      직책: e.position,
      직급: e.jobGrade,
      사원: e.name,
      입사일: e.hireDate ?? "",
      퇴사일: e.resignDate ?? "",
      이메일: e.email,
      사번: e.empNo,
      영문이름: e.englishName,
      사원구분: e.empCategory,
      "재직/퇴직구분": e.employmentStatus,
      주민등록번호: e.residentId,
      성별: e.gender,
      생년월일: e.birthDate ?? "",
      "양/음": e.calendarType,
      나이: e.age ?? "",
      고용형태: e.employType,
      "내/외국인": e.nationalityType,
      급여처리그룹: e.payrollGroup,
      비고: e.remarks,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "사원명부");
    XLSX.writeFile(book, `사원명부_${filters.asOfDate}.xlsx`);
  }

  async function printHrCards(targets: Employee[]) {
    if (targets.length === 0) {
      setError("인사카드를 출력할 사원을 선택하세요.");
      return;
    }
    const limited = targets.slice(0, HR_CARD_MAX);
    setHrCardBusy(true);
    setError("");
    try {
      const response = await fetch(hrApi("/employees/hr-cards"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employees: limited.map((emp) => ({
            empNo: emp.empNo,
            company: emp.companyCode,
          })),
        }),
      });
      const data = (await response.json()) as {
        cards?: EmployeeHrCard[];
        truncated?: boolean;
        max?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "인사카드를 불러오지 못했습니다.");
      }
      const cards = data.cards ?? [];
      if (cards.length === 0) {
        throw new Error("출력할 인사카드 데이터가 없습니다.");
      }
      printAfterRender.current = true;
      setHrCards(cards);
      setDetail(null);
      if (targets.length > HR_CARD_MAX) {
        setError(
          `한 번에 최대 ${HR_CARD_MAX}명까지 출력합니다. 나머지 인원은 다시 선택해 주세요.`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "인사카드 출력에 실패했습니다.",
      );
      setHrCardBusy(false);
    }
  }

  useEffect(() => {
    if (!printAfterRender.current || hrCards.length === 0) return;
    printAfterRender.current = false;
    document.body.classList.add("printing-hr-card");
    const timer = window.setTimeout(() => {
      window.print();
      document.body.classList.remove("printing-hr-card");
      setHrCardBusy(false);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [hrCards]);

  useEffect(() => {
    function onAfterPrint() {
      document.body.classList.remove("printing-hr-card");
    }
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);

  const empCategories = options?.empCategories ?? [];
  const positions = options?.positions ?? [];
  const jobGrades = options?.jobGrades ?? [];
  const genders = options?.genders?.length
    ? options.genders
    : ["남자", "여자"];
  const employmentStatuses = options?.employmentStatuses?.length
    ? options.employmentStatuses
    : ["재직자", "퇴직자"];
  const companyCodes =
    options?.companies?.length ? options.companies : [...COMPANY_CODES];

  return (
    <div className="flex min-h-0 flex-1 flex-col print:h-auto print:overflow-visible">
      <div className="inquiry-screen flex min-h-0 flex-1 flex-col gap-4 print:h-auto print:overflow-visible">
      <div className="no-print flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="submit"
          form="inquiry-filters"
          className="rounded-lg bg-[#004b87] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#003a6b]"
        >
          조회
        </button>
        <button
          type="button"
          onClick={exportExcel}
          disabled={employees.length === 0}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        >
          엑셀
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          출력
        </button>
        <button
          type="button"
          onClick={() => {
            const selected = employees.filter((emp) => selectedIds.has(emp.id));
            void printHrCards(selected);
          }}
          disabled={hrCardBusy || employees.length === 0}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
        >
          {hrCardBusy ? "준비 중..." : "인사카드"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
        >
          초기화
        </button>
        <p className="ml-auto text-sm text-slate-500">
          총{" "}
          <span className="font-semibold text-slate-700">
            {employees.length.toLocaleString("ko-KR")}
          </span>
          명
          {companyCounts.length > 0 ? (
            <>
              {" "}
              (
              {companyCounts.map((item, index) => (
                <span key={item.code}>
                  {index > 0 ? ", " : ""}
                  {item.code} : {item.count.toLocaleString("ko-KR")}명
                </span>
              ))}
              )
            </>
          ) : null}
        </p>
      </div>

      {error ? (
        <p className="no-print shrink-0 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <form
        id="inquiry-filters"
        onSubmit={handleSearch}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          if (event.nativeEvent.isComposing) return;
          if (!(event.target instanceof HTMLInputElement)) return;
          event.preventDefault();
          handleSearch();
        }}
        className="no-print w-full shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-800">조회조건</h2>
        </div>
        <button type="submit" className="sr-only">
          조회
        </button>
        <div className="flex w-full items-end gap-3 px-5 py-4">
          <div className="min-w-0 flex-[0.9]">
            <label className={labelClass}>회사구분</label>
            <select
              value={draft.company}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className={inputClass}
            >
              <option value="">전체</option>
              {companyCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className={labelClass}>사원구분</label>
            <select
              value={draft.empCategory}
              onChange={(e) => patchDraft("empCategory", e.target.value)}
              className={inputClass}
            >
              <option value="">전체</option>
              {empCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className={labelClass}>직책</label>
            <select
              value={draft.position}
              onChange={(e) => patchDraft("position", e.target.value)}
              className={inputClass}
            >
              <option value="">전체</option>
              {positions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className={labelClass}>직급</label>
            <select
              value={draft.jobGrade}
              onChange={(e) => patchDraft("jobGrade", e.target.value)}
              className={inputClass}
            >
              <option value="">전체</option>
              {jobGrades.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-[1.4]">
            <label className={labelClass}>사원</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                value={draft.empNo}
                onChange={(e) => patchDraft("empNo", e.target.value)}
                placeholder="사번"
                className={inputClass}
              />
              <input
                value={draft.empName}
                onChange={(e) => patchDraft("empName", e.target.value)}
                placeholder="성명"
                className={inputClass}
              />
            </div>
          </div>
          <div className="min-w-0 flex-[1.7]">
            <label className={labelClass}>입사일</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={draft.hireDateFrom}
                onChange={(e) => patchDraft("hireDateFrom", e.target.value)}
                className={inputClass}
              />
              <span className="shrink-0 text-xs text-slate-400">~</span>
              <input
                type="date"
                value={draft.hireDateTo}
                onChange={(e) => patchDraft("hireDateTo", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="min-w-0 flex-[1.7]">
            <label className={labelClass}>퇴사일</label>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={draft.resignDateFrom}
                onChange={(e) => patchDraft("resignDateFrom", e.target.value)}
                className={inputClass}
              />
              <span className="shrink-0 text-xs text-slate-400">~</span>
              <input
                type="date"
                value={draft.resignDateTo}
                onChange={(e) => patchDraft("resignDateTo", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <label className={labelClass}>재직/퇴직</label>
            <select
              value={draft.employmentStatus}
              onChange={(e) => patchDraft("employmentStatus", e.target.value)}
              className={inputClass}
            >
              <option value="">전체</option>
              {employmentStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-[0.8]">
            <label className={labelClass}>성별</label>
            <select
              value={draft.gender}
              onChange={(e) => patchDraft("gender", e.target.value)}
              className={inputClass}
            >
              <option value="">전체</option>
              {genders.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-[1.5]">
            <label className={labelClass}>부서</label>
            <select
              value={draft.departmentName}
              onChange={(e) => patchDraft("departmentName", e.target.value)}
              className={inputClass}
            >
              <option value="">전체</option>
              {departments.map((dept) => (
                <option key={dept.fullName || dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:h-auto print:overflow-visible">
        {isLoading ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            불러오는 중...
          </p>
        ) : employees.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            {rosterUnavailable
              ? filters.company
                ? `${filters.company} 사원명부(${rosterTableFor(filters.company)})가 아직 준비되지 않았습니다.`
                : "조회 가능한 사원명부가 아직 준비되지 않았습니다."
              : "조회 결과가 없습니다."}
          </p>
        ) : (
          <div>
            <table className="w-full table-fixed text-left text-[13px] leading-[21px]">
              <colgroup>
                <col className="w-[36px]" />
                <col className="w-[28px]" />
                <col className="w-[44px]" />
                <col className="w-[11%]" />
                <col className="w-[72px]" />
                <col className="w-[72px]" />
                <col className="w-[7%]" />
                <col className="w-[78px]" />
                <col className="w-[78px]" />
                <col className="w-[13%]" />
                <col className="w-[64px]" />
                <col className="w-[72px]" />
                <col className="w-[88px]" />
                <col className="w-[108px]" />
                <col className="w-[36px]" />
                <col className="w-[78px]" />
                <col className="w-[40px]" />
                <col className="w-[36px]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-slate-50 text-[12px] text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-1.5 py-2 font-medium">
                    No
                  </th>
                  <th className="whitespace-nowrap px-1 py-2 font-medium">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="전체 선택"
                    />
                  </th>
                  <SortableTh
                    label="회사"
                    sortKey="companyCode"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="부서"
                    sortKey="departmentName"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="직책"
                    sortKey="position"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="직급"
                    sortKey="jobGrade"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="사원"
                    sortKey="name"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="입사일"
                    sortKey="hireDate"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="퇴사일"
                    sortKey="resignDate"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="이메일"
                    sortKey="email"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="사번"
                    sortKey="empNo"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="사원구분"
                    sortKey="empCategory"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="재직/퇴직구분"
                    sortKey="employmentStatus"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="주민등록번호"
                    sortKey="residentId"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="성별"
                    sortKey="gender"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="생년월일"
                    sortKey="birthDate"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="양/음"
                    sortKey="calendarType"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                  <SortableTh
                    label="나이"
                    sortKey="age"
                    sorts={sorts}
                    onToggle={toggleSort}
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedEmployees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="whitespace-nowrap px-1.5 py-1.5 text-slate-400">
                      {index + 1}
                    </td>
                    <td className="whitespace-nowrap px-1 py-1.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(emp.id)}
                        onChange={() => toggleOne(emp.id)}
                        aria-label={`${emp.name} 선택`}
                      />
                    </td>
                    <td className="truncate px-1.5 py-1.5">{emp.companyCode}</td>
                    <td className="truncate px-1.5 py-1.5" title={emp.departmentName}>
                      {emp.departmentName}
                    </td>
                    <td className="truncate px-1.5 py-1.5" title={emp.position}>
                      {emp.position}
                    </td>
                    <td className="truncate px-1.5 py-1.5" title={emp.jobGrade}>
                      {emp.jobGrade}
                    </td>
                    <td className="truncate px-1.5 py-1.5">
                      <button
                        type="button"
                        onClick={() => setDetail(emp)}
                        className="font-medium text-[#004b87] hover:underline"
                      >
                        {emp.name}
                      </button>
                    </td>
                    <td className="truncate px-1.5 py-1.5">{emp.hireDate}</td>
                    <td className="truncate px-1.5 py-1.5">{emp.resignDate}</td>
                    <td className="truncate px-1.5 py-1.5" title={emp.email}>
                      {emp.email}
                    </td>
                    <td className="truncate px-1.5 py-1.5">{emp.empNo}</td>
                    <td className="truncate px-1.5 py-1.5">{emp.empCategory}</td>
                    <td className="truncate px-1.5 py-1.5">
                      <span
                        className={`rounded-full px-1.5 py-px text-[11px] font-medium ${
                          emp.employmentStatus === "재직자"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {emp.employmentStatus}
                      </span>
                    </td>
                    <td className="truncate px-1.5 py-1.5 font-mono text-[12px]">
                      {emp.residentId}
                    </td>
                    <td className="truncate px-1.5 py-1.5">{emp.gender}</td>
                    <td className="truncate px-1.5 py-1.5">{emp.birthDate}</td>
                    <td className="truncate px-1.5 py-1.5">{emp.calendarType}</td>
                    <td className="truncate px-1.5 py-1.5">{emp.age ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detail ? (
        <EmployeeDetailModal
          employee={detail}
          onClose={() => setDetail(null)}
          onPrintHrCard={() => void printHrCards([detail])}
          hrCardBusy={hrCardBusy}
        />
      ) : null}
      {sortBusy ? (
        <div className="no-print fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40">
          <div className="rounded-2xl bg-white px-10 py-8 shadow-xl">
            <p className="text-sm font-semibold text-slate-800">정렬 중입니다</p>
          </div>
        </div>
      ) : null}
      </div>
      <EmployeeHrCardPrint cards={hrCards} />
    </div>
  );
}
