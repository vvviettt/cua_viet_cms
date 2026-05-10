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
  const msg = e instanceof Error ? e.message : String(e);
  const cause = e && typeof e === "object" && "cause" in e ? (e as { cause?: { code?: string } }).cause : undefined;
  if (cause?.code === "42P07" || msg.includes("already exists")) {
    console.error(
      "\nGợi ý: DB đã có bảng nhưng drizzle.__drizzle_migrations có thể trống — Drizzle chạy lại từ 0000.\n" +
        "Nếu schema của bạn đã khớp tới migration 0041, baseline rồi migrate lại:\n" +
        "  npm run db:migrate:baseline -- 0041_banner_section_document_file\n" +
        "  npm run db:migrate\n",
    );
  }
  process.exit(1);
});
