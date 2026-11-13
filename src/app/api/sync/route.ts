import { z } from "zod";
import { getDb } from "@/db/client";
import { quizAttempts, reviewEvents } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const MAX_EVENTS = 200;
const MAX_BODY_BYTES = 64 * 1024;
// Reject timestamps far in the future or before the site existed.
const at = z.number().int().min(Date.UTC(2024, 0, 1)).refine((t) => t < Date.now() + 5 * 60_000, "timestamp in the future");

const Event = z.discriminatedUnion("kind", [
  z.object({ id: z.uuid(), kind: z.literal("review"), slug: z.string().regex(/^[a-z0-9-]{1,64}$/), rating: z.number().int().min(1).max(4), at }),
  z.object({
    id: z.uuid(), kind: z.literal("attempt"), questionId: z.string().regex(/^[a-z0-9-]{1,80}$/),
    domain: z.string().regex(/^[a-z]{1,20}$/), correct: z.boolean(), at,
  }),
]);

const Body = z.object({ deviceId: z.uuid(), events: z.array(Event).min(1).max(MAX_EVENTS) });

/**
 * Receives progress events queued on a device. Idempotent: event IDs are
 * primary keys and duplicates are ignored, so clients can retry freely.
 * Responds 503 when no database is configured; the client then keeps
 * everything locally.
 */
export async function POST(req: Request) {
  const limit = rateLimit(`sync:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) {
    return Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((limit.reset - Date.now()) / 1000)) } });
  }

  const db = getDb();
  if (!db) return Response.json({ mode: "local-only" }, { status: 503 });

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return Response.json({ error: "too_large" }, { status: 413 });

  let json: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
    json = JSON.parse(text);
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) return Response.json({ error: "invalid_body", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });

  const { deviceId, events } = parsed.data;
  const reviews = events.filter((e) => e.kind === "review");
  const attempts = events.filter((e) => e.kind === "attempt");

  try {
    await db.transaction(async (tx) => {
      if (reviews.length)
        await tx.insert(reviewEvents).values(reviews.map((e) => ({
          id: e.id, deviceId, cardSlug: e.slug, rating: e.rating, reviewedAt: new Date(e.at),
        }))).onConflictDoNothing();
      if (attempts.length)
        await tx.insert(quizAttempts).values(attempts.map((e) => ({
          id: e.id, deviceId, questionId: e.questionId, domain: e.domain, correct: e.correct, answeredAt: new Date(e.at),
        }))).onConflictDoNothing();
    });
  } catch (err) {
    console.error("sync insert failed", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }

  // Every valid event is now stored (new or duplicate), so the client can clear them all.
  return Response.json({ accepted: events.map((e) => e.id) });
}
