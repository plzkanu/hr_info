import { NextResponse } from "next/server";
import { attachSessionCookie } from "@/lib/auth";
import {
  LOGIN_MAX_PER_ACCOUNT,
  LOGIN_MAX_PER_IP,
  LOGIN_WINDOW_MS,
  clientKey,
  consumeRateLimit,
  resetRateLimit,
} from "@/lib/rate-limit";
import { toSessionUser } from "@/lib/types";
import { completeForcedPasswordChange } from "@/lib/users-store";

function tooManyAttempts(retryAfterSec: number) {
  return NextResponse.json(
    { error: "시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

/** 초기화 비밀번호 로그인 후 강제 변경 (세션 없이) */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    const userId = body.userId?.trim() ?? "";
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "필수 항목을 입력해 주세요." },
        { status: 400 },
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "새 비밀번호 확인이 일치하지 않습니다." },
        { status: 400 },
      );
    }

    const accountKey = clientKey(request, `pwchange:${userId}`);
    const ipKey = clientKey(request, "pwchange");
    const accountLimit = consumeRateLimit(
      accountKey,
      LOGIN_MAX_PER_ACCOUNT,
      LOGIN_WINDOW_MS,
    );
    const ipLimit = consumeRateLimit(ipKey, LOGIN_MAX_PER_IP, LOGIN_WINDOW_MS);
    if (!accountLimit.ok) return tooManyAttempts(accountLimit.retryAfterSec);
    if (!ipLimit.ok) return tooManyAttempts(ipLimit.retryAfterSec);

    const user = await completeForcedPasswordChange(
      userId,
      currentPassword,
      newPassword,
    );

    resetRateLimit(accountKey);
    resetRateLimit(ipKey);
    resetRateLimit(clientKey(request, `login:${userId}`));
    resetRateLimit(clientKey(request, "login"));

    const session = toSessionUser(user);

    const response = NextResponse.json({ user: session });
    return attachSessionCookie(response, session);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "비밀번호 변경에 실패했습니다.",
      },
      { status: 400 },
    );
  }
}
