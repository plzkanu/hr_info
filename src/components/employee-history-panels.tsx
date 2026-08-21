"use client";

import {
  EmployeeHistoryTable,
  useEmployeeRelatedRows,
} from "@/components/employee-history-table";
import type {
  Employee,
  EmployeeCareer,
  EmployeeEducation,
  EmployeeLanguage,
  EmployeeLicense,
  EmployeeRewardPenalty,
} from "@/lib/types";
import { hrApi } from "@/lib/hr-api";

function dash(value: string | number | null | undefined) {
  if (value == null || value === "") return "-";
  if (typeof value === "number") return value.toLocaleString("ko-KR");
  return value;
}

function Badge({ show, label }: { show: boolean; label: string }) {
  if (!show) return null;
  return (
    <span className="rounded-full bg-[#004b87]/8 px-1.5 py-0.5 text-[10px] font-medium text-[#004b87]">
      {label}
    </span>
  );
}

export function EmployeeEducationPanel({ employee }: { employee: Employee }) {
  const { rows, isLoading, error } = useEmployeeRelatedRows<EmployeeEducation>(
    employee,
    hrApi("/employees/education"),
    "학력 정보를 불러오지 못했습니다.",
  );

  return (
    <EmployeeHistoryTable
      title="학력"
      rows={rows}
      isLoading={isLoading}
      error={error}
      loadingText="학력 정보를 불러오는 중..."
      emptyText="등록된 학력이 없습니다."
      minWidthClass="min-w-[880px]"
      columns={[
        {
          header: "학력",
          className: "whitespace-nowrap px-3 py-2.5",
          render: (row) => (
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-slate-800">
                {dash(row.careerName)}
              </span>
              <Badge show={row.isLast} label="최종" />
              <Badge show={row.isApplied} label="인정" />
            </div>
          ),
        },
        {
          header: "학교",
          className: "px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.schoolName),
        },
        {
          header: "전공",
          className: "px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.majorName),
        },
        {
          header: "부전공",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.minorName),
        },
        {
          header: "주야",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.dayNightName),
        },
        {
          header: "입학",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.enterYearMonth),
        },
        {
          header: "졸업",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.graduateYearMonth),
        },
        {
          header: "학위",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.degreeName),
        },
        {
          header: "소재지",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.location),
        },
      ]}
    />
  );
}

export function EmployeeCareerPanel({ employee }: { employee: Employee }) {
  const { rows, isLoading, error } = useEmployeeRelatedRows<EmployeeCareer>(
    employee,
    hrApi("/employees/career"),
    "경력 정보를 불러오지 못했습니다.",
  );

  return (
    <EmployeeHistoryTable
      title="경력"
      rows={rows}
      isLoading={isLoading}
      error={error}
      loadingText="경력 정보를 불러오는 중..."
      emptyText="등록된 경력이 없습니다."
      minWidthClass="min-w-[900px]"
      columns={[
        {
          header: "입사일",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.enterDate),
        },
        {
          header: "퇴사일",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.resignDate),
        },
        {
          header: "회사",
          className: "px-3 py-2.5 font-medium text-slate-800",
          render: (row) => dash(row.companyName),
        },
        {
          header: "부서",
          className: "px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.departmentName),
        },
        {
          header: "직위",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.positionName),
        },
        {
          header: "담당업무",
          className: "px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.dutyName),
        },
        {
          header: "퇴사사유",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.resignReasonName),
        },
        {
          header: "비고",
          className: "max-w-[200px] truncate px-3 py-2.5 text-slate-600",
          render: (row) => dash(row.remark || row.careerTypeName),
        },
      ]}
    />
  );
}

export function EmployeeLicensesPanel({ employee }: { employee: Employee }) {
  const { rows, isLoading, error } = useEmployeeRelatedRows<EmployeeLicense>(
    employee,
    hrApi("/employees/licenses"),
    "자격증 정보를 불러오지 못했습니다.",
  );

  return (
    <EmployeeHistoryTable
      title="자격증"
      rows={rows}
      isLoading={isLoading}
      error={error}
      loadingText="자격증 정보를 불러오는 중..."
      emptyText="등록된 자격증이 없습니다."
      minWidthClass="min-w-[920px]"
      columns={[
        {
          header: "자격증명",
          className: "px-3 py-2.5 font-medium text-slate-800",
          render: (row) => dash(row.licenseName),
        },
        {
          header: "분류",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.groupName),
        },
        {
          header: "발급기관",
          className: "px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.issueInstitution),
        },
        {
          header: "자격번호",
          className:
            "whitespace-nowrap px-3 py-2.5 font-mono text-xs text-slate-700",
          render: (row) => dash(row.licenseNo),
        },
        {
          header: "취득일",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.acquireDate),
        },
        {
          header: "유효일",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.validDate),
        },
        {
          header: "수당",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => (row.allowPay ? "여" : "부"),
        },
        {
          header: "법정",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => (row.statutory ? "여" : "부"),
        },
        {
          header: "비고",
          className: "max-w-[200px] truncate px-3 py-2.5 text-slate-600",
          render: (row) => dash(row.remark),
        },
      ]}
    />
  );
}

export function EmployeeLanguagesPanel({ employee }: { employee: Employee }) {
  const { rows, isLoading, error } = useEmployeeRelatedRows<EmployeeLanguage>(
    employee,
    hrApi("/employees/languages"),
    "어학 정보를 불러오지 못했습니다.",
  );

  return (
    <EmployeeHistoryTable
      title="어학"
      rows={rows}
      isLoading={isLoading}
      error={error}
      loadingText="어학 정보를 불러오는 중..."
      emptyText="등록된 어학 성적이 없습니다."
      minWidthClass="min-w-[760px]"
      columns={[
        {
          header: "어학",
          className: "whitespace-nowrap px-3 py-2.5 font-medium text-slate-800",
          render: (row) => dash(row.languageName),
        },
        {
          header: "검정",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.authTypeName),
        },
        {
          header: "점수",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.score),
        },
        {
          header: "등급",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.gradeName),
        },
        {
          header: "취득일",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.beginDate),
        },
        {
          header: "만료일",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.endDate),
        },
        {
          header: "수당",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => (row.allowPay ? "여" : "부"),
        },
        {
          header: "비고",
          className: "max-w-[220px] truncate px-3 py-2.5 text-slate-600",
          render: (row) => dash(row.remark),
        },
      ]}
    />
  );
}

export function EmployeeRewardPenaltyPanel({
  employee,
}: {
  employee: Employee;
}) {
  const { rows, isLoading, error } =
    useEmployeeRelatedRows<EmployeeRewardPenalty>(
      employee,
      hrApi("/employees/reward-penalty"),
      "상벌 정보를 불러오지 못했습니다.",
    );

  return (
    <EmployeeHistoryTable
      title="상벌"
      rows={rows}
      isLoading={isLoading}
      error={error}
      loadingText="상벌 정보를 불러오는 중..."
      emptyText="등록된 상벌이 없습니다."
      minWidthClass="min-w-[880px]"
      columns={[
        {
          header: "구분",
          className: "whitespace-nowrap px-3 py-2.5",
          render: (row) => {
            const isPenalty = row.typeName.includes("벌");
            return (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                  isPenalty
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {dash(row.typeName)}
              </span>
            );
          },
        },
        {
          header: "상벌명",
          className: "px-3 py-2.5 font-medium text-slate-800",
          render: (row) => dash(row.name),
        },
        {
          header: "일자",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.fromDate),
        },
        {
          header: "종료일",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.toDate),
        },
        {
          header: "내외",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.inOutName),
        },
        {
          header: "시행기관",
          className: "px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.institution),
        },
        {
          header: "사유",
          className: "max-w-[240px] truncate px-3 py-2.5 text-slate-600",
          render: (row) => dash(row.reason),
        },
        {
          header: "취소일",
          className: "whitespace-nowrap px-3 py-2.5 text-slate-700",
          render: (row) => dash(row.cancelledDate),
        },
      ]}
    />
  );
}
