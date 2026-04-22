/**
 * Chạy migration Drizzle với biến môi trường từ `.env` / `.env.local`
 * (tránh `source .env` lỗi khi giá trị có ký tự Unicode).
 * Dùng: npm run db:migrate
 */
import { config } from "dotenv";
import * as path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("Thiếu DATABASE_URL trong .env hoặc .env.local.");
    process.exit(1);
  }
  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  const folder = path.resolve(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder: folder });
  await pool.end();
  console.log("Đã chạy xong db:migrate.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
