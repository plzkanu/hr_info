"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Employee } from "@/lib/types";

export function useEmployeeRelatedRows<T>(
  employee: Employee,
  endpoint: string,
  loadError: string,
) {
  const [rows, setRows] = useState<T[]>([]);
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
        const response = await fetch(`${endpoint}?${params.toString()}`);
        const data = (await response.json()) as {
          rows?: T[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? loadError);
        }
        if (!cancelled) setRows(data.rows ?? []);
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
  }, [employee.empNo, employee.companyCode, endpoint, loadError]);

  return { rows, isLoading, error };
}

export interface HistoryColumn<T> {
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface EmployeeHistoryTableProps<T extends { key: string }> {
  title: string;
  countSuffix?: string;
  rows: T[];
  isLoading: boolean;
  error: string;
  loadingText: string;
  emptyText: string;
  minWidthClass?: string;
  columns: HistoryColumn<T>[];
}

export function EmployeeHistoryTable<T extends { key: string }>({
  title,
  countSuffix = "건",
  rows,
  isLoading,
  error,
  loadingText,
  emptyText,
  minWidthClass = "min-w-[860px]",
  columns,
}: EmployeeHistoryTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        {loadingText}
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
        {emptyText}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,38,69,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[#004b87]">{title}</h3>
        <p className="text-[12px] text-slate-400">
          {rows.length.toLocaleString("ko-KR")}
          {countSuffix}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className={`w-full ${minWidthClass} text-left text-[13px]`}>
          <thead className="sticky top-0 bg-slate-50 text-[11px] font-medium tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.header} className="px-3 py-2.5">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td
                    key={column.header}
                    className={column.className ?? "px-3 py-2.5 text-slate-700"}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
