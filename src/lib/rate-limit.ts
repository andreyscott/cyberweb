/**
 * Small fixed-window rate limiter kept in memory.
 *
 * Good enough for launch: each server instance enforces its own limit, so the
 * real ceiling is (limit × instances). When you need a global limit, swap this
 * for Upstash Redis (@upstash/ratelimit has a free tier) behind the same
 * function signature.
 */
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset <= now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    return { ok: true, remaining: limit - 1, reset: now + windowMs };
  }
  entry.count++;
  return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count), reset: entry.reset };
}

/** Best-effort client IP behind Vercel or another proxy. */
export function clientIp(req: Request) {
  return req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
