type Counter = { count: number; resetAt: number };

const hits = new Map<string, Counter>();

function prune(now: number) {
  if (hits.size < 400) return;
  for (const [key, value] of hits) {
    if (value.resetAt <= now) hits.delete(key);
  }
}

export function clientKey(request: Request, extra: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip =
    forwarded ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown";
  return `${ip}:${extra.trim().toLowerCase()}`;
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const current = hits.get(key);
  if (!current || current.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  current.count += 1;
  if (current.count > limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
  return { ok: true };
}

export function resetRateLimit(key: string) {
  hits.delete(key);
}

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_PER_ACCOUNT = 5;
export const LOGIN_MAX_PER_IP = 20;
