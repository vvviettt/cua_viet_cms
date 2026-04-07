import { compareSync, hashSync } from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { citizenAccounts } from "@/lib/db/schema";

/** Chuẩn hoá SĐT VN cho khớp bản ghi (chỉ số, bắt đầu 0). */
export function normalizeCitizenPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("84") && d.length >= 10) {
    d = `0${d.slice(2)}`;
  }
  if (d.length === 9 && /^[3-9]/.test(d)) {
    d = `0${d}`;
  }
  if (d.length < 9 || d.length > 11) return null;
  if (!d.startsWith("0")) return null;
  return d;
}

/** Cùng chuỗi với chỗ tạo tài khoản ẩn danh khi gửi phản ánh không đăng nhập. */
export const ANON_CITIZEN_PASSWORD_PLAINTEXT = "app-anonymous-citizen-submit";

const anonCitizenPasswordHash = hashSync(ANON_CITIZEN_PASSWORD_PLAINTEXT, 8);

/** Tài khoản chỉ tạo qua form gửi phản ánh (chưa đặt mật khẩu đăng nhập). */
export function isAnonymousCitizenPasswordHash(passwordHash: string): boolean {
  return compareSync(ANON_CITIZEN_PASSWORD_PLAINTEXT, passwordHash);
}

export type CitizenAccountAuthRow = {
  id: string;
  phone: string;
  fullName: string;
  address: string;
  email: string | null;
  passwordHash: string;
};

export async function findCitizenAccountByPhoneForAuth(
  phone: string,
): Promise<CitizenAccountAuthRow | null> {
  const [row] = await getDb()
    .select({
      id: citizenAccounts.id,
      phone: citizenAccounts.phone,
      fullName: citizenAccounts.fullName,
      address: citizenAccounts.address,
      email: citizenAccounts.email,
      passwordHash: citizenAccounts.passwordHash,
    })
    .from(citizenAccounts)
    .where(eq(citizenAccounts.phone, phone.trim()))
    .limit(1);
  return row ?? null;
}

export async function findCitizenAccountByIdForAuth(
  id: string,
): Promise<Omit<CitizenAccountAuthRow, "passwordHash"> | null> {
  const [row] = await getDb()
    .select({
      id: citizenAccounts.id,
      phone: citizenAccounts.phone,
      fullName: citizenAccounts.fullName,
      address: citizenAccounts.address,
      email: citizenAccounts.email,
    })
    .from(citizenAccounts)
    .where(eq(citizenAccounts.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertCitizenRegisteredAccount(input: {
  phone: string;
  passwordHash: string;
  fullName: string;
  address: string;
  email: string | null;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(citizenAccounts)
    .values({
      phone: input.phone,
      passwordHash: input.passwordHash,
      fullName: input.fullName.trim(),
      address: input.address.trim(),
      email: input.email,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: citizenAccounts.id });
  if (!row) throw new Error("Không tạo được tài khoản.");
  return row.id;
}

export async function upgradeAnonymousCitizenPassword(input: {
  id: string;
  passwordHash: string;
  fullName: string;
  address: string;
  email: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(citizenAccounts)
    .set({
      passwordHash: input.passwordHash,
      fullName: input.fullName.trim(),
      address: input.address.trim(),
      email: input.email,
      updatedAt: now,
    })
    .where(eq(citizenAccounts.id, input.id));
}

export async function findCitizenAccountIdByPhone(phone: string): Promise<string | null> {
  const normalized = phone.trim();
  if (!normalized) return null;
  const [row] = await getDb()
    .select({ id: citizenAccounts.id })
    .from(citizenAccounts)
    .where(eq(citizenAccounts.phone, normalized))
    .limit(1);
  return row?.id ?? null;
}

/** Tạo hoặc cập nhật tài khoản công dân khi gửi phản ánh qua API công khai. */
export async function upsertCitizenAccountFromPublicForm(input: {
  phone: string;
  fullName: string;
  address: string;
  email: string | null;
}): Promise<string> {
  const now = new Date().toISOString();
  const db = getDb();
  const existingId = await findCitizenAccountIdByPhone(input.phone);
  const emailTrim = input.email?.trim() ? input.email.trim() : null;

  if (existingId) {
    await db
      .update(citizenAccounts)
      .set({
        fullName: input.fullName.trim(),
        address: input.address.trim(),
        email: emailTrim,
        updatedAt: now,
      })
      .where(eq(citizenAccounts.id, existingId));
    return existingId;
  }

  const [row] = await db
    .insert(citizenAccounts)
    .values({
      phone: input.phone,
      email: emailTrim,
      passwordHash: anonCitizenPasswordHash,
      fullName: input.fullName.trim(),
      address: input.address.trim(),
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: citizenAccounts.id });

  if (!row) throw new Error("Không tạo được tài khoản công dân.");
  return row.id;
}
