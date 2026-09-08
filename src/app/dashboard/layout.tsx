import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { IdleTimeoutWatcher } from "@/components/idle-timeout-watcher";
import { getSessionUser } from "@/lib/auth";
import { getLatestRosterSyncedAt } from "@/lib/employees-store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  let rosterSyncedAt: string | null = null;
  try {
    rosterSyncedAt = await getLatestRosterSyncedAt();
  } catch {
    rosterSyncedAt = null;
  }

  return (
    <div className="dashboard-shell h-screen overflow-hidden bg-[#F5F6F8]">
      <IdleTimeoutWatcher />
      <AppSidebar user={user} rosterSyncedAt={rosterSyncedAt} />
      <main className="print-main ml-[220px] flex h-screen flex-col overflow-hidden p-7">
        {children}
      </main>
    </div>
  );
}
