"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hrApi } from "@/lib/hr-api";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    try {
      await fetch(hrApi("/auth/logout"), { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoading}
      className={
        className ??
        "rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
      }
    >
      {isLoading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}
