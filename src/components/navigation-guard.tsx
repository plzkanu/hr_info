"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { hrApi } from "@/lib/hr-api";

type Trap = { id: number; close: () => void };

const GUARD_STATE = { hrInfoNav: "guard" as const };

const NavigationGuardContext = createContext<{
  registerTrap: (close: () => void) => () => void;
} | null>(null);

function isDashboardPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const trapsRef = useRef<Trap[]>([]);
  const lastPathRef = useRef(pathname);
  const idRef = useRef(0);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const restoreGuard = useCallback(() => {
    window.history.pushState(GUARD_STATE, "", window.location.href);
  }, []);

  useEffect(() => {
    lastPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const state = window.history.state as { hrInfoNav?: string } | null;
    if (state?.hrInfoNav !== "guard" && state?.hrInfoNav !== "trap") {
      restoreGuard();
    }

    function onPopState() {
      const trap = trapsRef.current.pop();
      if (trap) {
        trap.close();
        restoreGuard();
        return;
      }

      const pathBefore = lastPathRef.current;
      window.setTimeout(() => {
        const pathNow = window.location.pathname;
        lastPathRef.current = pathNow;
        if (!isDashboardPath(pathNow)) {
          return;
        }
        if (pathNow !== pathBefore) {
          return;
        }
        setLogoutOpen(true);
        restoreGuard();
      }, 0);
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [restoreGuard]);

  const registerTrap = useCallback((close: () => void) => {
    const id = ++idRef.current;
    trapsRef.current.push({ id, close });
    return () => {
      const idx = trapsRef.current.findIndex((item) => item.id === id);
      if (idx >= 0) trapsRef.current.splice(idx, 1);
    };
  }, []);

  async function confirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch(hrApi("/auth/logout"), { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  return (
    <NavigationGuardContext.Provider value={{ registerTrap }}>
      {children}
      {logoutOpen ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="leave-logout-title"
          aria-describedby="leave-logout-desc"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2
              id="leave-logout-title"
              className="text-lg font-bold text-[#004b87]"
            >
              로그아웃
            </h2>
            <p
              id="leave-logout-desc"
              className="mt-3 text-sm leading-relaxed text-slate-600"
            >
              사이트를 나가면 로그아웃됩니다.
              <br />
              로그아웃 하시겠습니까?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutOpen(false)}
                disabled={loggingOut}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void confirmLogout()}
                disabled={loggingOut}
                className="rounded-lg bg-[#004b87] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#003a6b] disabled:opacity-60"
              >
                {loggingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </NavigationGuardContext.Provider>
  );
}

export function useBackTrap(active: boolean, onClose: () => void) {
  const ctx = useContext(NavigationGuardContext);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active || !ctx) return;
    return ctx.registerTrap(() => onCloseRef.current());
  }, [active, ctx]);
}
