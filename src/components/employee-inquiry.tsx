"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { EmployeeDetailModal } from "@/components/employee-detail-modal";
import { todayIsoDate } from "@/lib/format";
import { COMPANY_CODES, COMPANY_ROSTER_TABLE, parseCompanyFilter, type CompanyFilter } from "@/lib/companies";
import type {
  Department,
  Employee,
  EmployeeFilterOptions,
} from "@/lib/types";

const inputClass =
  "min-w-0 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-[#009ada] focus:ring-1 focus:ring-[#009ada]/20";
const labelClass = "mb-1 block text-[11px] font-medium text-slate-600";

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

  const loadMeta = useCallback(async (company: CompanyFilter) => {
    const [deptRes, optRes] = await Promise.all([
      fetch(`/api/departments?company=${company}`),
      fetch(`/api/employees?meta=1&company=${company}`),
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
      const response = await fetch(`/api/employees?${toQuery(nextFilters)}`);
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
  }

  const allSelected = useMemo(
    () => employees.length > 0 && employees.every((e) => selectedIds.has(e.id)),
    [employees, selectedIds],
  );

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
    const rows = employees.map((e, index) => ({
      번호: index + 1,
      회사: e.companyCode,
      부서: e.departmentName,
      사원: e.name,
      입사일: e.hireDate ?? "",
      퇴사일: e.resignDate ?? "",
      이메일: e.email,
      직책: e.position,
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

  const empCategories = options?.empCategories ?? [];
  const employmentStatuses = options?.employmentStatuses?.length
    ? options.employmentStatuses
    : ["재직자", "퇴직자"];

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleSearch()}
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
        </p>
      </div>

      {error ? (
        <p className="no-print rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleSearch}
        className="no-print w-full rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-slate-800">조회조건</h2>
        </div>
        <div className="flex w-full items-end gap-3 px-5 py-4">
          <div className="min-w-0 flex-[0.9]">
            <label className={labelClass}>회사구분</label>
            <select
              value={draft.company}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className={inputClass}
            >
              <option value="">전체</option>
              {COMPANY_CODES.map((code) => (
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

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            불러오는 중...
          </p>
        ) : employees.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-500">
            {rosterUnavailable
              ? filters.company
                ? `${filters.company} 사원명부(${COMPANY_ROSTER_TABLE[filters.company]})가 아직 준비되지 않았습니다.`
                : "조회 가능한 사원명부가 아직 준비되지 않았습니다."
              : "조회 결과가 없습니다."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 font-medium">No</th>
                  <th className="px-2 py-3 font-medium">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="전체 선택"
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">회사</th>
                  <th className="px-3 py-3 font-medium">부서</th>
                  <th className="px-3 py-3 font-medium">사원</th>
                  <th className="px-3 py-3 font-medium">입사일</th>
                  <th className="px-3 py-3 font-medium">퇴사일</th>
                  <th className="px-3 py-3 font-medium">이메일</th>
                  <th className="px-3 py-3 font-medium">직책</th>
                  <th className="px-3 py-3 font-medium">사번</th>
                  <th className="px-3 py-3 font-medium">영문이름</th>
                  <th className="px-3 py-3 font-medium">사원구분</th>
                  <th className="px-3 py-3 font-medium">재직/퇴직구분</th>
                  <th className="px-3 py-3 font-medium">주민등록번호</th>
                  <th className="px-3 py-3 font-medium">성별</th>
                  <th className="px-3 py-3 font-medium">생년월일</th>
                  <th className="px-3 py-3 font-medium">양/음</th>
                  <th className="px-3 py-3 font-medium">나이</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp, index) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-3 text-slate-400">{index + 1}</td>
                    <td className="px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(emp.id)}
                        onChange={() => toggleOne(emp.id)}
                        aria-label={`${emp.name} 선택`}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.companyCode}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.departmentName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDetail(emp)}
                        className="font-medium text-[#004b87] hover:underline"
                      >
                        {emp.name}
                      </button>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.hireDate}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.resignDate}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{emp.email}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.position}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{emp.empNo}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.englishName}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.empCategory}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          emp.employmentStatus === "재직자"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {emp.employmentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">
                      {emp.residentId}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{emp.gender}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.birthDate}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {emp.calendarType}
                    </td>
                    <td className="px-3 py-3">{emp.age ?? ""}</td>
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
        />
      ) : null}
    </div>
  );
}
