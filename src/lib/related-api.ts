import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";

export async function relatedEmployeeGet(
  request: Request,
  loader: (empNo: string, company?: string) => Promise<unknown>,
  dataKey: string,
  failMessage: string,
) {
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

    const rows = await loader(empNo, company);
    return NextResponse.json({ [dataKey]: rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : failMessage },
      { status: 500 },
    );
  }
}
