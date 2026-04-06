import { config } from "dotenv";
import { hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db/index";
import { users } from "../lib/db/schema";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@gmail.com").trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "12345678";
  if (password.length < 8) {
    console.error("Mật khẩu seed phải có ít nhất 8 ký tự (SEED_ADMIN_PASSWORD).");
    process.exit(1);
  }

  const now = new Date().toISOString();
  const passwordHash = hashSync(password, 12);
  const db = getDb();

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log("Đã có tài khoản với email này, bỏ qua:", email);
    return;
  }

  await db.insert(users).values({
    email,
    passwordHash,
    fullName: process.env.SEED_ADMIN_NAME ?? "Quản trị viên",
    role: "admin",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log("Đã tạo tài khoản admin:", email);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
