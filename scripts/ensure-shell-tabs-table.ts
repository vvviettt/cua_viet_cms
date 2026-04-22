/**
 * Tạo bảng `app_mobile_shell_tabs` nếu chưa có (idempotent).
 * Dùng khi DB báo "relation does not exist" nhưng lịch sử Drizzle migrate không đồng bộ.
 *
 *   npm run db:ensure:shell-tabs
 *
 * Sau đó vẫn nên chạy `npm run db:migrate` trên môi trường có journal Drizzle đúng,
 * hoặc ghi nhận migration 0024 trong bảng `__drizzle_migrations` nếu bạn quản lý tay.
 */
import { config } from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { Pool } from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("Thiếu DATABASE_URL.");
    process.exit(1);
  }
  const sqlPath = path.resolve(process.cwd(), "drizzle/0024_app_mobile_shell_tabs.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const pool = new Pool({ connectionString: url });
  await pool.query(sql);
  await pool.end();
  console.log("Đã áp dụng SQL từ drizzle/0024_app_mobile_shell_tabs.sql");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
