import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getEmployeeFamily } from "@/lib/family-store";
import { formatResidentId } from "@/lib/format";
import { hasPermission } from "@/lib/permissions";

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

    const revealFullResidentId = hasPermission(
      sessionOrResponse.permissions,
      "view_full_resident_id",
    );
    const members = await getEmployeeFamily(empNo, company);
    return NextResponse.json({
      members: members.map((member) => ({
        ...member,
        residentId: formatResidentId(member.residentId, revealFullResidentId),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "가족 조회 실패" },
      { status: 500 },
    );
  }
}
