import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { IdleTimeoutWatcher } from "@/components/idle-timeout-watcher";
import { NavigationGuard } from "@/components/navigation-guard";
import { getSessionUser } from "@/lib/auth";
import { getRosterSyncStatuses } from "@/lib/employees-store";
import type { RosterSyncStatus } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  let rosterSyncStatuses: RosterSyncStatus[] = [];
  try {
    rosterSyncStatuses = await getRosterSyncStatuses();
  } catch {
    rosterSyncStatuses = [];
  }

  return (
    <NavigationGuard>
      <div className="dashboard-shell h-screen overflow-hidden bg-[#F5F6F8]">
        <IdleTimeoutWatcher />
        <AppSidebar user={user} rosterSyncStatuses={rosterSyncStatuses} />
        <main className="print-main ml-[220px] flex h-screen flex-col overflow-hidden p-7">
          {children}
        </main>
      </div>
    </NavigationGuard>
  );
}
