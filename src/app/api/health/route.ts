import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";

export const dynamic = "force-dynamic";

/** For uptime monitors. Reports whether the database is configured and reachable. */
export async function GET() {
  const db = getDb();
  if (!db) return Response.json({ ok: true, database: "not-configured" });
  try {
    const started = Date.now();
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "up", latencyMs: Date.now() - started });
  } catch {
    return Response.json({ ok: false, database: "down" }, { status: 503 });
  }
}
