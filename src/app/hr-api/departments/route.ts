import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { parseCompanyFilter } from "@/lib/companies";
import { getAllDepartments } from "@/lib/departments";

export async function GET(request: Request) {
  const sessionOrResponse = await requireApiSession();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  try {
    const url = new URL(request.url);
    const company = parseCompanyFilter(url.searchParams.get("company"));
    const departments = await getAllDepartments(company);
    return NextResponse.json({ departments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "부서 조회 실패" },
      { status: 500 },
    );
  }
}
