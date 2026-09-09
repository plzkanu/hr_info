import { EmployeeInquiry } from "@/components/employee-inquiry";
import { getSessionUser } from "@/lib/auth";
import { canViewPersonalIdentity } from "@/lib/permissions";

export default async function DashboardPage() {
  const user = await getSessionUser();
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden print:h-auto print:overflow-visible">
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold text-[#004b87]">사원명부조회</h1>
      </div>
      <EmployeeInquiry
        canViewPersonalIdentity={canViewPersonalIdentity(user?.permissions)}
      />
    </div>
  );
}
