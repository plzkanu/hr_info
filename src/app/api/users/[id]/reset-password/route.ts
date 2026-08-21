import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { getSessionUser } from "@/lib/auth";
import { resetUserPassword } from "@/lib/users-store";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** 관리자: 사용자 비밀번호를 아이디+"!!"로 초기화 */
export async function POST(_request: Request, context: RouteContext) {
  const sessionOrResponse = await requireApiAdmin();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  const session = await getSessionUser();
  const { id } = await context.params;
  const targetId = id.trim().toLowerCase();

  if (session && session.id === targetId) {
    return NextResponse.json(
      {
        error: "본인 비밀번호는 사용자 관리의 초기화가 아닌 로그인 후 변경해 주세요.",
      },
      { status: 400 },
    );
  }

  try {
    const { temporaryPassword } = await resetUserPassword(targetId);
    return NextResponse.json({ temporaryPassword });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "비밀번호 초기화 실패",
      },
      { status: 400 },
    );
  }
}
