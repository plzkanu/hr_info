"use client";

import { useEmployeeRelatedRows } from "@/components/employee-history-table";
import type { Employee, EmployeeConstructionHistory } from "@/lib/types";
import { formatYearMonthDuration } from "@/lib/format";
import { hrApi } from "@/lib/hr-api";

function dash(value: string | number | null | undefined) {
  if (value == null || value === "") return "-";
  return value;
}

function period(row: EmployeeConstructionHistory) {
  if (!row.startDate && !row.endDate) return "-";
  return `${row.startDate || "-"} ~ ${row.endDate || "-"}`;
}

export function EmployeeConstructionHistoryPanel({
  employee,
}: {
  employee: Employee;
}) {
  const { rows, isLoading, error } =
    useEmployeeRelatedRows<EmployeeConstructionHistory>(
      employee,
      hrApi("/employees/construction-history"),
      "공사경력 정보를 불러오지 못했습니다.",
    );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        공사경력을 불러오는 중...
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
        등록된 공사경력이 없습니다.
      </div>
    );
  }

  const totalMonths = rows.reduce((sum, row) => sum + row.durationMonths, 0);
  const totalLabel = formatYearMonthDuration(totalMonths);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,38,69,0.04)]">
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-3 py-1.5">
        <h3 className="text-[13px] font-semibold text-[#004b87]">공사경력</h3>
        <p className="text-[12px] text-slate-400">
          {rows.length.toLocaleString("ko-KR")}건
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <table className="w-full table-fixed text-left text-[12px] leading-snug">
          <colgroup>
            <col className="w-9" />
            <col className="w-[88px]" />
            <col className="w-[56px]" />
            <col className="w-[52px]" />
            <col className="w-[108px]" />
            <col className="w-[48px]" />
            <col />
            <col className="w-[118px]" />
            <col className="w-[88px]" />
            <col className="w-[72px]" />
          </colgroup>
          <thead className="bg-slate-50 text-[11px] font-medium text-slate-500">
            <tr>
              <th className="px-1.5 py-1.5">No</th>
              <th className="px-1.5 py-1.5">발주처</th>
              <th className="px-1.5 py-1.5">발전소</th>
              <th className="px-1.5 py-1.5">공사종류</th>
              <th className="px-1.5 py-1.5">분야</th>
              <th className="px-1.5 py-1.5">직위</th>
              <th className="px-1.5 py-1.5">직무</th>
              <th className="px-1.5 py-1.5">공사기간</th>
              <th className="px-1.5 py-1.5">경력기간</th>
              <th className="px-1.5 py-1.5">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row, index) => (
              <tr key={row.key} className="hover:bg-slate-50/80">
                <td className="px-1.5 py-1.5 text-center text-slate-400">
                  {index + 1}
                </td>
                <td className="break-keep px-1.5 py-1.5 text-slate-700">
                  {dash(row.client)}
                </td>
                <td className="break-keep px-1.5 py-1.5 font-medium text-slate-800">
                  {dash(row.powerPlant)}
                </td>
                <td className="break-keep px-1.5 py-1.5 text-slate-700">
                  {dash(row.constructionType)}
                </td>
                <td className="break-keep px-1.5 py-1.5 text-slate-700">
                  {dash(row.field)}
                </td>
                <td className="break-keep px-1.5 py-1.5 text-slate-700">
                  {dash(row.position)}
                </td>
                <td className="break-keep px-1.5 py-1.5 text-slate-700">
                  {row.duty1 || row.duty2 ? (
                    <>
                      <span>{row.duty1}</span>
                      {row.duty2 ? (
                        <span className="mt-0.5 block text-slate-500">
                          {row.duty2}
                        </span>
                      ) : null}
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="break-keep px-1.5 py-1.5 text-slate-700">
                  {period(row)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1.5 text-slate-700">
                  {formatYearMonthDuration(row.durationMonths)}
                </td>
                <td className="truncate px-1.5 py-1.5 text-slate-600" title={row.notes || undefined}>
                  {dash(row.notes)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-200 bg-slate-50">
            <tr>
              <td
                colSpan={8}
                className="px-1.5 py-1.5 text-right text-[12px] font-semibold text-[#004b87]"
              >
                합계
              </td>
              <td className="whitespace-nowrap px-1.5 py-1.5 text-[12px] font-semibold text-[#004b87]">
                {totalLabel}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
