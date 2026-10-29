import { getAuthSecret } from "./auth-secret";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "hrinfo_session";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 8;

export interface SessionClaims {
  user: SessionUser;
  iat: number;
  exp: number;
  idleExp: number;
}

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function getHmacKey() {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function signPayload(payload: string) {
  const encoder = new TextEncoder();
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return bufferToHex(signature);
}

async function verifySignature(payload: string, signature: string) {
  const encoder = new TextEncoder();
  const key = await getHmacKey();
  return crypto.subtle.verify(
    "HMAC",
    key,
    hexToBuffer(signature),
    encoder.encode(payload),
  );
}

function normalizeSessionUser(user: SessionUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    department: user.department ?? "",
    role: user.role,
    permissions: user.permissions ?? [],
  };
}

export async function createSessionToken(
  user: SessionUser,
  times: Pick<SessionClaims, "iat" | "exp" | "idleExp">,
) {
  const payloadObject: SessionClaims = {
    user: normalizeSessionUser(user),
    iat: times.iat,
    exp: times.exp,
    idleExp: times.idleExp,
  };
  const payload = encodeBase64Url(JSON.stringify(payloadObject));
  const signature = await signPayload(payload);
  return `${payload}.${signature}`;
}

export async function parseSessionToken(
  token: string,
): Promise<SessionClaims | null> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return null;
  }

  const valid = await verifySignature(payload, signature);
  if (!valid) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as Partial<SessionClaims>;
    if (
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.idleExp !== "number" ||
      !parsed.user ||
      typeof parsed.user.id !== "string"
    ) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (now >= parsed.exp || now >= parsed.idleExp) {
      return null;
    }

    return {
      user: normalizeSessionUser(parsed.user),
      iat: parsed.iat,
      exp: parsed.exp,
      idleExp: parsed.idleExp,
    };
  } catch {
    return null;
  }
}
