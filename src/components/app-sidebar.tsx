"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChangeOwnPasswordModal } from "@/components/change-own-password-modal";
import { LogoutButton } from "@/components/logout-button";
import { deployedAtLabel } from "@/lib/build-info";
import { mainNavItems } from "@/lib/nav";
import type { SessionUser } from "@/lib/types";

interface AppSidebarProps {
  user: SessionUser;
}

const NAV_ICONS: Record<string, string> = {
  "/dashboard": "👥",
  "/dashboard/admin": "⚙️",
};

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/dashboard/admin") {
    return pathname.startsWith("/dashboard/admin");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const items = mainNavItems.filter(
    (item) => !item.adminOnly || user.role === "admin",
  );
  const initial = user.name.trim().charAt(0) || user.id.charAt(0);
  const deployedAt = deployedAtLabel();

  return (
    <aside className="app-sidebar fixed top-0 left-0 z-[100] flex h-screen w-[220px] flex-col bg-[#0F2645]">
      <div className="border-b border-white/8 px-[18px] pt-5 pb-4">
        <Link
          href="/dashboard"
          className="inline-flex rounded-lg bg-white px-3 py-2"
          aria-label="사원명부 홈"
        >
          <Image
            src="/soosan-logo.png"
            alt="SOOSAN"
            width={160}
            height={56}
            className="h-11 w-auto shrink-0 object-contain object-left"
            priority
          />
        </Link>
        <p className="mt-2 text-[11px] text-[#BCC0C8]">사원명부 조회 시스템</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-[18px] pt-2 pb-1 text-[10px] font-medium tracking-[0.08em] text-[#BCC0C8] uppercase">
          메뉴
        </p>
        {items.map((item) => {
          const isActive = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-2.5 px-[18px] py-2.5 text-[13px] transition-colors ${
                isActive
                  ? "bg-[#1E5FD4]/25 font-medium text-white"
                  : "font-normal text-white/65 hover:bg-white/6 hover:text-white"
              }`}
            >
              {isActive ? (
                <span
                  className="absolute top-0 bottom-0 left-0 w-[3px] rounded-r-sm bg-[#1E5FD4]"
                  aria-hidden
                />
              ) : null}
              <span className="w-[18px] text-center text-[15px]">
                {NAV_ICONS[item.href] ?? "•"}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/8 px-[18px] py-3.5">
        <button
          type="button"
          onClick={() => setShowPasswordModal(true)}
          className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition hover:bg-white/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          title="비밀번호 변경"
          aria-label={`${user.name} — 비밀번호 변경`}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1E5FD4] text-[13px] font-bold text-white">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-[#BCC0C8]">
              {[user.department, user.id].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-0.5 text-[10px] text-white/45">비밀번호 변경</p>
          </div>
        </button>
        <div className="mt-3">
          <LogoutButton className="w-full rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/10 disabled:opacity-60" />
        </div>
        <p className="mt-3 text-[10px] leading-4 text-white/35">
          배포
          <br />
          {deployedAt || "로컬 실행"}
        </p>
      </div>

      {showPasswordModal ? (
        <ChangeOwnPasswordModal
          userName={user.name}
          onClose={() => setShowPasswordModal(false)}
        />
      ) : null}
    </aside>
  );
}
