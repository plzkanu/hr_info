import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { toPublicUser } from "@/lib/types";
import type { UserRole } from "@/lib/types";
import { deleteUser, updateUser } from "@/lib/users-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const sessionOrResponse = await requireApiAdmin();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      name?: string;
      department?: string;
      role?: UserRole;
      active?: boolean;
      permissions?: string[];
    };

    const user = await updateUser(id, {
      name: body.name,
      department: body.department,
      role: body.role,
      active: body.active,
      permissions: body.permissions,
    });

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "계정 수정에 실패했습니다." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const sessionOrResponse = await requireApiAdmin();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  const { id } = await context.params;

  if (id === sessionOrResponse.id) {
    return NextResponse.json(
      { error: "현재 로그인한 계정은 삭제할 수 없습니다." },
      { status: 400 },
    );
  }

  try {
    await deleteUser(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "계정 삭제에 실패했습니다." },
      { status: 400 },
    );
  }
}
