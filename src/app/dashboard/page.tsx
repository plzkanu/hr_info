import { EmployeeInquiry } from "@/components/employee-inquiry";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#004b87]">사원명부조회</h1>
      </div>
      <EmployeeInquiry />
    </div>
  );
}
