import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/api-auth";
import { applyPersonalIdentityVisibility } from "@/lib/format";
import { HR_CARD_MAX } from "@/lib/hr-card";
import { getEmployeeHrCards } from "@/lib/hr-card-store";
import { canViewPersonalIdentity } from "@/lib/permissions";

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiSession();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  try {
    const body = (await request.json()) as {
      employees?: { empNo?: string; company?: string }[];
    };
    const keys = (body.employees ?? [])
      .map((item) => ({
        empNo: (item.empNo ?? "").trim(),
        company: (item.company ?? "").trim(),
      }))
      .filter((item) => item.empNo && item.company);

    if (keys.length === 0) {
      return NextResponse.json(
        { error: "출력할 사원을 선택하세요." },
        { status: 400 },
      );
    }

    const allowed = canViewPersonalIdentity(sessionOrResponse.permissions);
    const cards = await getEmployeeHrCards(keys);
    return NextResponse.json({
      cards: cards.map((card) => ({
        ...card,
        employee: applyPersonalIdentityVisibility(card.employee, allowed),
        family: card.family.map((member) =>
          applyPersonalIdentityVisibility(member, allowed),
        ),
      })),
      truncated: keys.length > HR_CARD_MAX,
      max: HR_CARD_MAX,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "인사카드 조회에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
