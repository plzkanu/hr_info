import { assertAuthSecret } from "@/lib/auth-secret";
import { warnIfProductionTlsBypassRequested } from "@/lib/supabase/config";

/** `next build` 수집 단계가 아니라 실제 서버 기동에서만 검사합니다. */
function isServerBoot() {
  if (process.env.NEXT_RUNTIME === "edge") return false;
  const phase = process.env.NEXT_PHASE ?? "";
  return (
    phase !== "phase-production-build" &&
    phase !== "phase-development-build"
  );
}

export async function register() {
  if (!isServerBoot()) return;
  warnIfProductionTlsBypassRequested();
  assertAuthSecret();
}
