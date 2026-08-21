import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/api-auth";
import { toPublicUser } from "@/lib/types";
import { createUser, getAllUsers } from "@/lib/users-store";
import type { UserRole } from "@/lib/types";

export async function GET() {
  const sessionOrResponse = await requireApiAdmin();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  try {
    const users = await getAllUsers();
    return NextResponse.json({ users: users.map(toPublicUser) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "조회 실패" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const sessionOrResponse = await requireApiAdmin();
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      department?: string;
      role?: UserRole;
      active?: boolean;
      permissions?: string[];
    };

    const { user, temporaryPassword } = await createUser({
      id: body.id ?? "",
      name: body.name ?? "",
      department: body.department,
      role: body.role ?? "user",
      active: body.active,
      permissions: body.permissions,
    });

    return NextResponse.json(
      { user: toPublicUser(user), temporaryPassword },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "계정 생성에 실패했습니다." },
      { status: 400 },
    );
  }
}
