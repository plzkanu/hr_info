import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { getEmployeeEducation } from "@/lib/education-store";
import { canViewPersonalIdentity } from "@/lib/permissions";
import { relatedEmployeeGet } from "@/lib/related-api";

export async function GET(request: Request) {
  const sessionOrResponse = await requireApiSession();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  if (!canViewPersonalIdentity(sessionOrResponse.permissions)) {
    return NextResponse.json({ rows: [] });
  }

  return relatedEmployeeGet(
    request,
    getEmployeeEducation,
    "rows",
    "학력 조회 실패",
  );
}
