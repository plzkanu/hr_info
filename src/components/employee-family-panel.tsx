"use client";

import { useEffect, useState } from "react";
import type { Employee, EmployeeFamilyMember } from "@/lib/types";
import { hrApi } from "@/lib/hr-api";

interface EmployeeFamilyPanelProps {
  employee: Employee;
}

function yn(value: boolean) {
  return value ? "여" : "부";
}

export function EmployeeFamilyPanel({ employee }: EmployeeFamilyPanelProps) {
  const [rows, setRows] = useState<EmployeeFamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ empNo: employee.empNo });
        if (employee.companyCode) params.set("company", employee.companyCode);
        const response = await fetch(
          `${hrApi("/employees/family")}?${params.toString()}`,
        );
        const data = (await response.json()) as {
          members?: EmployeeFamilyMember[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "가족 정보를 불러오지 못했습니다.");
        }
        if (!cancelled) setRows(data.members ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "조회에 실패했습니다.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [employee.empNo, employee.companyCode]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        가족 정보를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        등록된 가족이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,38,69,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#004b87]">가족</h3>
        <p className="text-[12px] text-slate-400">
          {rows.length.toLocaleString("ko-KR")}명
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[920px] text-left text-[13px]">
          <thead className="sticky top-0 bg-slate-50 text-[11px] font-medium tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">관계</th>
              <th className="px-3 py-2.5">성명</th>
              <th className="px-3 py-2.5">생년월일</th>
              <th className="px-3 py-2.5">주민등록번호</th>
              <th className="px-3 py-2.5">연락처</th>
              <th className="px-3 py-2.5">학력</th>
              <th className="px-3 py-2.5">직업</th>
              <th className="px-3 py-2.5">동거</th>
              <th className="px-3 py-2.5">부양</th>
              <th className="px-3 py-2.5">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-800">
                  {row.relationName || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-800">
                  {row.name || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.birthDate || "-"}
                  {row.birthTypeName ? (
                    <span className="ml-1 text-[11px] text-slate-400">
                      {row.birthTypeName}
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700">
                  {row.residentId || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.phone || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.educationName || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.occupation || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {yn(row.liveTogether)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.dependTypeName || "-"}
                </td>
                <td className="px-3 py-2.5 text-slate-600">
                  {[
                    row.deceased
                      ? `사망${row.deathDate ? ` ${row.deathDate}` : ""}`
                      : "",
                    row.handicapped ? row.handicapTypeName || "장애" : "",
                    row.payAllow ? "수당" : "",
                    row.medical ? "의료" : "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
