import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getEmployeeAppointments } from "@/lib/appointments-store";

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

    const appointments = await getEmployeeAppointments(empNo, company);
    return NextResponse.json({ appointments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "발령 조회 실패" },
      { status: 500 },
    );
  }
}
