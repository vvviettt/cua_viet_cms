/**
 * Khi PostgreSQL đã có bảng (migrate / push / restore) nhưng `drizzle.__drizzle_migrations` trống,
 * `npm run db:migrate` chạy lại từ `0000_init` và lỗi kiểu `relation "work_schedules" already exists`.
 *
 * Drizzle chỉ nhìn **một** dòng mới nhất (`created_at` lớn nhất): mọi migration có `when` trong
 * journal ≤ giá trị đó được coi là đã xong; chỉ các file có `when` lớn hơn mới được thực thi.
 *
 * Chèn **một** marker cho migration journal **cuối cùng mà bạn chắc chắn DB đã khớp schema**,
 * rồi chạy lại `db:migrate` để áp các migration mới hơn (vd. 0042).
 *
 * Dùng:
 *   npm run db:migrate:baseline -- 0041_banner_section_document_file
 *   npm run db:migrate
 */
import { config } from "dotenv";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { Pool } from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

const tag = process.argv[2]?.trim();
if (!tag) {
  console.error(
    "Thiếu tham số: tag trong drizzle/meta/_journal.json (vd. 0041_banner_section_document_file).\n" +
      "Ví dụ: npm run db:migrate:baseline -- 0041_banner_section_document_file",
  );
  process.exit(1);
}

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("Thiếu DATABASE_URL trong .env hoặc .env.local.");
    process.exit(1);
  }

  const journalPath = path.resolve(process.cwd(), "drizzle/meta/_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8")) as {
    entries: Array<{ tag: string; when: number }>;
  };
  const entry = journal.entries.find((e) => e.tag === tag);
  if (!entry) {
    console.error(`Không tìm thấy tag "${tag}" trong meta/_journal.json.`);
    process.exit(1);
  }

  const sqlPath = path.resolve(process.cwd(), "drizzle", `${entry.tag}.sql`);
  const query = fs.readFileSync(sqlPath, "utf8");
  const hash = crypto.createHash("sha256").update(query).digest("hex");
  const createdAt = entry.when;

  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`);
    await pool.query(`
			CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at bigint
			)
		`);

    const { rows } = await pool.query<{ c: string }>(
      `select count(*)::text as c from drizzle."__drizzle_migrations"`,
    );
    const n = Number(rows[0]?.c ?? 0);
    if (n > 0) {
      const { rows: last } = await pool.query<{ hash: string; created_at: string }>(
        `select hash, created_at::text from drizzle."__drizzle_migrations" order by created_at desc, id desc limit 1`,
      );
      console.warn(
        `Cảnh báo: đã có ${n} dòng trong drizzle.__drizzle_migrations. ` +
          `Dòng mới nhất: created_at=${last[0]?.created_at}, hash=${last[0]?.hash?.slice(0, 12)}…`,
      );
      console.warn("Chỉ tiếp tục baseline nếu bạn hiểu rõ (vd. bảng tracking bị xóa nhầm).");
    }

    await pool.query(
      `INSERT INTO drizzle."__drizzle_migrations" ("hash", "created_at") VALUES ($1, $2)`,
      [hash, createdAt],
    );
    console.log(
      `Đã baseline: tag=${tag} created_at=${createdAt} hash=${hash.slice(0, 16)}…\n` +
        `Chạy tiếp: npm run db:migrate`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
