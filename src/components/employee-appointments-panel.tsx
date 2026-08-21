"use client";

import { useEffect, useState } from "react";
import type { Employee, EmployeeAppointment } from "@/lib/types";
import { hrApi } from "@/lib/hr-api";

interface EmployeeAppointmentsPanelProps {
  employee: Employee;
}

export function EmployeeAppointmentsPanel({
  employee,
}: EmployeeAppointmentsPanelProps) {
  const [rows, setRows] = useState<EmployeeAppointment[]>([]);
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
          `${hrApi("/employees/appointments")}?${params.toString()}`,
        );
        const data = (await response.json()) as {
          appointments?: EmployeeAppointment[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "발령 이력을 불러오지 못했습니다.");
        }
        if (!cancelled) setRows(data.appointments ?? []);
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
        발령 이력을 불러오는 중...
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
        발령 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,38,69,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#004b87]">발령 이력</h3>
        <p className="text-[12px] text-slate-400">
          {rows.length.toLocaleString("ko-KR")}건
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead className="sticky top-0 bg-slate-50 text-[11px] font-medium tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2.5">발령일</th>
              <th className="px-3 py-2.5">종료일</th>
              <th className="px-3 py-2.5">발령명</th>
              <th className="px-3 py-2.5">발령부서</th>
              <th className="px-3 py-2.5">직급</th>
              <th className="px-3 py-2.5">직종</th>
              <th className="px-3 py-2.5">직무</th>
              <th className="px-3 py-2.5">근무상태</th>
              <th className="px-3 py-2.5">내용</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/80">
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.orderDate || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.orderEndDate || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-800">
                      {row.orderName || "-"}
                    </span>
                    {row.isLast ? (
                      <span className="rounded-full bg-[#004b87]/8 px-1.5 py-0.5 text-[10px] font-medium text-[#004b87]">
                        최종
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-slate-700">
                  {row.orderDepartmentName || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.jobGradeName || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.jobTypeName || "-"}
                </td>
                <td className="px-3 py-2.5 text-slate-700">
                  {row.jobName || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-slate-700">
                  {row.workStatusName || "-"}
                </td>
                <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-600">
                  {row.contents || row.remark || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
