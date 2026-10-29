import { NextResponse } from "next/server";
import { attachSessionCookie, getSessionState } from "@/lib/auth";

export async function POST() {
  const state = await getSessionState();
  if (!state) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: state.user,
  });

  return attachSessionCookie(response, state.user, state.claims);
}
