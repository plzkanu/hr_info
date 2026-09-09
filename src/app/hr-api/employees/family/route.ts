import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getEmployeeFamily } from "@/lib/family-store";
import { applyPersonalIdentityVisibility } from "@/lib/format";
import { canViewPersonalIdentity } from "@/lib/permissions";

export async function GET(request: Request) {
  const sessionOrResponse = await requireApiSession();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  try {
    const url = new URL(request.url);
    const empNo = url.searchParams.get("empNo")?.trim() ?? "";
    const company = url.searchParams.get("company")?.trim() ?? "";

    if (!empNo) {
      return NextResponse.json(
        { error: "사번이 필요합니다." },
        { status: 400 },
      );
    }

    const allowed = canViewPersonalIdentity(sessionOrResponse.permissions);
    const members = await getEmployeeFamily(empNo, company);
    return NextResponse.json({
      members: members.map((member) =>
        applyPersonalIdentityVisibility(member, allowed),
      ),
      canViewPersonalIdentity: allowed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "가족 조회 실패" },
      { status: 500 },
    );
  }
}
