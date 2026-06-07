import { Pool } from "pg";

// Lazily-created Postgres pool from DATABASE_URL. Shared by the ingestion API
// (Next route) and the local scripts (seed / detect). No paid infra required:
// point DATABASE_URL at a local Postgres (Docker or `supabase start`).
let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    pool = new Pool({ connectionString });
  }
  return pool;
}
