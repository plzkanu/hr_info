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
import { verifyUserCredentials } from "@/lib/users-store";

function tooManyAttempts(retryAfterSec: number) {
  return NextResponse.json(
    { error: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    },
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      userId?: string;
      password?: string;
    };

    const userId = body.userId?.trim() ?? "";
    const password = body.password ?? "";

    if (!userId || !password) {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    const accountKey = clientKey(request, `login:${userId}`);
    const ipKey = clientKey(request, "login");
    const accountLimit = consumeRateLimit(
      accountKey,
      LOGIN_MAX_PER_ACCOUNT,
      LOGIN_WINDOW_MS,
    );
    const ipLimit = consumeRateLimit(ipKey, LOGIN_MAX_PER_IP, LOGIN_WINDOW_MS);
    if (!accountLimit.ok) return tooManyAttempts(accountLimit.retryAfterSec);
    if (!ipLimit.ok) return tooManyAttempts(ipLimit.retryAfterSec);

    const user = await verifyUserCredentials(userId, password);
    if (!user) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

    resetRateLimit(accountKey);
    resetRateLimit(ipKey);

    if (user.passwordMustChange) {
      return NextResponse.json({
        mustChangePassword: true,
        userId: user.id,
        name: user.name,
      });
    }

    const session = toSessionUser(user);

    const response = NextResponse.json({ user: session });
    return attachSessionCookie(response, session);
  } catch {
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
