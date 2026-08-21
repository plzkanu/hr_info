import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { changeOwnPassword } from "@/lib/users-store";

/** 로그인 사용자 본인 비밀번호 변경 */
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      newPassword?: string;
      confirmPassword?: string;
    };

    const newPassword = body.newPassword ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: "필수 항목을 입력해 주세요." },
        { status: 400 },
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." },
        { status: 400 },
      );
    }

    await changeOwnPassword(session.id, newPassword);
    return NextResponse.json({ ok: true });
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
