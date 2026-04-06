import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  cmsPool: Pool | undefined;
  cmsDb: Db | undefined;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("Thiếu biến môi trường DATABASE_URL (PostgreSQL).");
  }
  return url;
}

export function getDb(): Db {
  if (globalForDb.cmsDb) {
    return globalForDb.cmsDb;
  }
  globalForDb.cmsPool ??= new Pool({ connectionString: getDatabaseUrl() });
  globalForDb.cmsDb = drizzle(globalForDb.cmsPool, { schema });
  return globalForDb.cmsDb;
}
