import { NextResponse } from "next/server";
import { attachSessionCookie } from "@/lib/auth";
import { toSessionUser } from "@/lib/types";
import { verifyUserCredentials } from "@/lib/users-store";

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

    const user = await verifyUserCredentials(userId, password);
    if (!user) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 },
      );
    }

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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "로그인 처리 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
