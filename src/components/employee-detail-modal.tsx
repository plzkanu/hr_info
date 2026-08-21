"use client";

import { useEffect, useState } from "react";
import { EmployeeAppointmentsPanel } from "@/components/employee-appointments-panel";
import { EmployeeFamilyPanel } from "@/components/employee-family-panel";
import {
  EmployeeCareerPanel,
  EmployeeEducationPanel,
  EmployeeLanguagesPanel,
  EmployeeLicensesPanel,
  EmployeeRewardPenaltyPanel,
} from "@/components/employee-history-panels";
import type { Employee } from "@/lib/types";

const TABS = [
  { id: "profile", label: "사원상세" },
  { id: "personal", label: "개인신상/주소" },
  { id: "appointment", label: "발령" },
  { id: "family", label: "가족" },
  { id: "education", label: "학력" },
  { id: "certificate", label: "자격증" },
  { id: "language", label: "어학" },
  { id: "career", label: "경력" },
  { id: "reward", label: "상벌" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface EmployeeDetailModalProps {
  employee: Employee;
  onClose: () => void;
}

const PROFILE_SECTIONS: { title: string; fields: { label: string; value: (e: Employee) => string }[] }[] = [
  {
    title: "기본정보",
    fields: [
      { label: "회사", value: (e) => e.companyCode },
      { label: "성명", value: (e) => e.name },
      { label: "사번", value: (e) => e.empNo },
      { label: "영문이름", value: (e) => e.englishName },
      { label: "주민등록번호", value: (e) => e.residentId },
      { label: "성별", value: (e) => e.gender },
      { label: "생년월일", value: (e) => e.birthDate ?? "" },
      { label: "나이", value: (e) => (e.age != null ? String(e.age) : "") },
      { label: "내/외국인", value: (e) => e.nationalityType },
    ],
  },
  {
    title: "소속 · 인사",
    fields: [
      { label: "부서", value: (e) => e.departmentName },
      { label: "부서경로", value: (e) => e.departmentFullName },
      { label: "직책", value: (e) => e.position },
      { label: "직급", value: (e) => e.jobGrade },
      { label: "사원구분", value: (e) => e.empCategory },
      { label: "고용형태", value: (e) => e.employType },
      { label: "재직/퇴직", value: (e) => e.employmentStatus },
      { label: "입사일", value: (e) => e.hireDate ?? "" },
      { label: "퇴사일", value: (e) => e.resignDate ?? "" },
      { label: "근속", value: (e) => e.tenure },
      { label: "급여처리그룹", value: (e) => e.payrollGroup },
    ],
  },
  {
    title: "연락 · 기타",
    fields: [
      { label: "이메일", value: (e) => e.email },
      { label: "휴대폰", value: (e) => e.cellphone },
      { label: "비고", value: (e) => e.remarks },
    ],
  },
];

export function EmployeeDetailModal({
  employee,
  onClose,
}: EmployeeDetailModalProps) {
  const [tab, setTab] = useState<TabId>("profile");
  const initial = employee.name.trim().charAt(0) || employee.empNo.charAt(0);
  const isActive = employee.employmentStatus === "재직자";

  useEffect(() => {
    setTab("profile");
  }, [employee.id]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="employee-detail-title"
        className="flex h-[871px] w-[980px] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,38,69,0.28)]"
      >
        <header className="flex h-[88px] shrink-0 items-center gap-4 bg-[#0F2645] px-6 text-white">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1E5FD4] text-lg font-bold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="employee-detail-title"
                className="text-[17px] font-semibold tracking-tight"
              >
                {employee.name || "-"}
              </h2>
              <span className="rounded-full bg-white/12 px-2 py-0.5 text-[11px] font-medium tracking-wide text-white/90">
                {employee.companyCode}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  isActive
                    ? "bg-emerald-400/20 text-emerald-200"
                    : "bg-white/12 text-white/70"
                }`}
              >
                {employee.employmentStatus || "구분없음"}
              </span>
            </div>
            <p className="mt-1 truncate text-[13px] text-white/55">
              {[employee.empNo, employee.departmentName, employee.position]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex size-8 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </header>

        <nav className="grid shrink-0 grid-cols-9 border-b border-slate-200 bg-[#F5F6F8]">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`relative h-[46px] whitespace-nowrap px-1 text-[12px] transition ${
                  active
                    ? "bg-white font-semibold text-[#004b87]"
                    : "font-medium text-slate-500 hover:bg-white/70 hover:text-slate-700"
                }`}
              >
                {item.label}
                {active ? (
                  <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-t-full bg-[#004b87]" />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div
          className={`min-h-0 flex-1 bg-[#F8F9FB] p-5 ${
            tab === "appointment" ||
            tab === "family" ||
            tab === "education" ||
            tab === "certificate" ||
            tab === "language" ||
            tab === "career" ||
            tab === "reward"
              ? "flex overflow-hidden"
              : "overflow-y-auto"
          }`}
        >
          {tab === "profile" ? (
            <div className="space-y-4">
              {PROFILE_SECTIONS.map((section) => (
                <section
                  key={section.title}
                  className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,38,69,0.04)]"
                >
                  <h3 className="border-b border-slate-100 px-4 py-2.5 text-[13px] font-semibold text-[#004b87]">
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-3">
                    {section.fields.map((field) => (
                      <div
                        key={field.label}
                        className="border-b border-slate-50 px-4 py-3 last:border-b-0"
                      >
                        <p className="text-[11px] text-slate-400">{field.label}</p>
                        <p className="mt-1 truncate text-[13px] font-medium text-slate-800">
                          {field.value(employee) || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : tab === "appointment" ? (
            <EmployeeAppointmentsPanel employee={employee} />
          ) : tab === "family" ? (
            <EmployeeFamilyPanel employee={employee} />
          ) : tab === "education" ? (
            <EmployeeEducationPanel employee={employee} />
          ) : tab === "certificate" ? (
            <EmployeeLicensesPanel employee={employee} />
          ) : tab === "language" ? (
            <EmployeeLanguagesPanel employee={employee} />
          ) : tab === "career" ? (
            <EmployeeCareerPanel employee={employee} />
          ) : tab === "reward" ? (
            <EmployeeRewardPenaltyPanel employee={employee} />
          ) : (
            <PendingTab label={TABS.find((item) => item.id === tab)?.label ?? ""} />
          )}
        </div>
      </div>
    </div>
  );
}

function PendingTab({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-[0_1px_2px_rgba(15,38,69,0.04)]">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#004b87]/8 text-[#004b87]">
          <span className="text-lg font-semibold">···</span>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-800">{label}</p>
        <p className="mt-1.5 text-[13px] leading-6 text-slate-500">
          테이블 구성 후 이 탭에 표시됩니다.
        </p>
      </div>
    </div>
  );
}
