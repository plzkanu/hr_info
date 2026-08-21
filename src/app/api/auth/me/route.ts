import { NextResponse } from "next/server";
import { getApiSession, unauthorizedResponse } from "@/lib/api-auth";

export async function GET() {
  const session = await getApiSession();
  if (!session) return unauthorizedResponse();
  return NextResponse.json({ user: session });
}
