import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * One pool per function instance, created on first use.
 *
 * DATABASE_URL must be the *pooled* connection string (Neon: host contains
 * "-pooler"; Supabase: port 6543). The pooler (PgBouncer in transaction mode)
 * multiplexes thousands of clients onto a small number of real Postgres
 * connections. Use DATABASE_URL_UNPOOLED for migrations.
 *
 * Returns null when no database is configured, so the site still works
 * (progress stays on the device) on a fresh deploy.
 */
let db: NodePgDatabase<typeof schema> | null | undefined;

export function getDb() {
  if (db !== undefined) return db;
  const url = process.env.DATABASE_URL;
  if (!url) return (db = null);
  const pool = new Pool({
    connectionString: url,
    // Several requests share one instance on Fluid compute, so keep a few connections, not one.
    max: Number(process.env.DB_POOL_MAX ?? 5),
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
  });
  // Closes idle connections before Vercel suspends the instance, so they don't leak.
  attachDatabasePool(pool);
  return (db = drizzle(pool, { schema }));
}
