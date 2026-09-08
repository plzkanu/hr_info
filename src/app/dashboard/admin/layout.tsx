import { redirect } from "next/navigation";
import { AdminSubNav } from "@/components/admin-sub-nav";
import { getSessionUser, requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  if (!requireAdmin(user)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto sm:flex-row">
      <AdminSubNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
