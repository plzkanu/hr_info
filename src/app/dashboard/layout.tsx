import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { IdleTimeoutWatcher } from "@/components/idle-timeout-watcher";
import { getSessionUser } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8]">
      <IdleTimeoutWatcher />
      <AppSidebar user={user} />
      <main className="print-main ml-[220px] min-h-screen flex-1 p-7">
        {children}
      </main>
    </div>
  );
}
