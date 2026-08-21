import { NextResponse } from "next/server";

function ok() {
  return NextResponse.json({ ok: true, service: "hr-info" });
}

export function GET() {
  return ok();
}

export function HEAD() {
  return new NextResponse(null, { status: 200 });
}
