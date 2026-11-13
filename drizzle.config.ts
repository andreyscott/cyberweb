import { defineConfig } from "drizzle-kit";

// Migrations need a direct (unpooled) connection: PgBouncer in transaction mode
// doesn't support the session features migration tools use.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "" },
  strict: true,
});
