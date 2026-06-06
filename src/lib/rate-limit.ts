// Lightweight in-memory fixed-window rate limiter.
//
// LIMITATION: state lives in the function instance's memory, so on Vercel each
// serverless instance counts independently and a cold start resets the window.
// It still blunts bursts/abuse from a single client hitting one instance. For
// strict, global limits move this to Upstash Redis (@upstash/ratelimit) and
// set UPSTASH_REDIS_REST_URL/TOKEN — the call sites below won't need to change.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Opportunistically drop expired buckets so the map can't grow without bound.
function sweep(now: number) {
  if (store.size < 5000) return;
  for (const [key, b] of store) {
    if (b.resetAt <= now) store.delete(key);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number; // epoch ms when the window resets
  retryAfter: number; // seconds until reset (0 when ok)
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfter: 0,
  };
}

// Best-effort client IP from common proxy headers (Vercel sets x-forwarded-for).
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
