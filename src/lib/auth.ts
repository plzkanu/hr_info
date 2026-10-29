import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getIdleTimeoutSettings } from "@/lib/app-settings";
import {
  createSessionToken,
  parseSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SEC,
  type SessionClaims,
} from "./session-token";
import { findUserById } from "./users-store";
import { toSessionUser, type SessionUser } from "./types";

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SEC,
};

async function cookieTimes(previous?: SessionClaims) {
  const now = Math.floor(Date.now() / 1000);
  const settings = await getIdleTimeoutSettings();
  const iat = previous?.iat ?? now;
  const exp = previous?.exp ?? now + SESSION_MAX_AGE_SEC;
  const idleWindowSec =
    settings.idleTimeoutMinutes <= 0
      ? SESSION_MAX_AGE_SEC
      : settings.idleTimeoutMinutes * 60 + settings.graceSeconds;
  const idleExp = Math.min(exp, now + idleWindowSec);
  const maxAge = Math.max(1, Math.min(exp, idleExp) - now);
  return { iat, exp, idleExp, maxAge };
}

export async function attachSessionCookie(
  response: NextResponse,
  user: SessionUser,
  previous?: SessionClaims,
) {
  const times = await cookieTimes(previous);
  const token = await createSessionToken(user, times);
  response.cookies.set(SESSION_COOKIE, token, {
    ...sessionCookieOptions,
    maxAge: times.maxAge,
  });
  return response;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionState(): Promise<{
  user: SessionUser;
  claims: SessionClaims;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const claims = await parseSessionToken(token);
  if (!claims) {
    return null;
  }

  try {
    const user = await findUserById(claims.user.id);
    if (!user || !user.active || user.passwordMustChange) {
      return null;
    }
    return { user: toSessionUser(user), claims };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const state = await getSessionState();
  return state?.user ?? null;
}

export function requireAdmin(
  session: SessionUser | null,
): session is SessionUser {
  return session?.role === "admin";
}
