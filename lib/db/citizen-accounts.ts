import { compareSync, hashSync } from "bcryptjs";
import { count, desc, eq } from "drizzle-orm";
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

/** Chuẩn hoá CCCD (12 chữ số). */
export function normalizeCitizenCccd(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 12) return null;
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
  cccd: string | null;
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
      cccd: citizenAccounts.cccd,
      address: citizenAccounts.address,
      email: citizenAccounts.email,
      passwordHash: citizenAccounts.passwordHash,
    })
    .from(citizenAccounts)
    .where(eq(citizenAccounts.phone, phone.trim()))
    .limit(1);
  return row ?? null;
}

export async function findCitizenAccountByCccdForAuth(
  cccd: string,
): Promise<CitizenAccountAuthRow | null> {
  const [row] = await getDb()
    .select({
      id: citizenAccounts.id,
      phone: citizenAccounts.phone,
      fullName: citizenAccounts.fullName,
      cccd: citizenAccounts.cccd,
      address: citizenAccounts.address,
      email: citizenAccounts.email,
      passwordHash: citizenAccounts.passwordHash,
    })
    .from(citizenAccounts)
    .where(eq(citizenAccounts.cccd, cccd))
    .limit(1);
  return row ?? null;
}

export async function findCitizenAccountByIdForPasswordAuth(
  id: string,
): Promise<CitizenAccountAuthRow | null> {
  const [row] = await getDb()
    .select({
      id: citizenAccounts.id,
      phone: citizenAccounts.phone,
      fullName: citizenAccounts.fullName,
      cccd: citizenAccounts.cccd,
      address: citizenAccounts.address,
      email: citizenAccounts.email,
      passwordHash: citizenAccounts.passwordHash,
    })
    .from(citizenAccounts)
    .where(eq(citizenAccounts.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateCitizenPasswordById(
  id: string,
  passwordHash: string,
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(citizenAccounts)
    .set({ passwordHash, updatedAt: now })
    .where(eq(citizenAccounts.id, id));
}

export async function findCitizenAccountByIdForAuth(
  id: string,
): Promise<Omit<CitizenAccountAuthRow, "passwordHash"> | null> {
  const [row] = await getDb()
    .select({
      id: citizenAccounts.id,
      phone: citizenAccounts.phone,
      fullName: citizenAccounts.fullName,
      cccd: citizenAccounts.cccd,
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
  cccd: string;
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
      cccd: input.cccd,
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
  cccd: string;
  address: string;
  email: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(citizenAccounts)
    .set({
      passwordHash: input.passwordHash,
      fullName: input.fullName.trim(),
      cccd: input.cccd,
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

export type CitizenAccountListItem = {
  id: string;
  phone: string;
  fullName: string;
  cccd: string | null;
  address: string;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const CITIZEN_ACCOUNT_LIST_PAGE_SIZE = 15;

export type CitizenAccountListPage = {
  items: CitizenAccountListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function listCitizenAccountsPaginated(opts: {
  page: number;
  pageSize: number;
}): Promise<CitizenAccountListPage> {
  const db = getDb();
  const [countRow] = await db.select({ c: count() }).from(citizenAccounts);
  const total = Number(countRow?.c ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / opts.pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, opts.page), totalPages);
  const offset = totalPages === 0 ? 0 : (safePage - 1) * opts.pageSize;

  const items = await db
    .select({
      id: citizenAccounts.id,
      phone: citizenAccounts.phone,
      fullName: citizenAccounts.fullName,
      cccd: citizenAccounts.cccd,
      address: citizenAccounts.address,
      email: citizenAccounts.email,
      isActive: citizenAccounts.isActive,
      createdAt: citizenAccounts.createdAt,
      updatedAt: citizenAccounts.updatedAt,
    })
    .from(citizenAccounts)
    .orderBy(desc(citizenAccounts.createdAt))
    .limit(opts.pageSize)
    .offset(offset);

  return {
    items,
    total,
    page: safePage,
    pageSize: opts.pageSize,
  };
}

export async function updateCitizenProfileById(
  id: string,
  input: {
    fullName: string;
    phone: string;
    address: string;
    email: string | null;
  },
): Promise<Omit<CitizenAccountAuthRow, "passwordHash">> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .update(citizenAccounts)
    .set({
      fullName: input.fullName.trim(),
      phone: input.phone,
      address: input.address.trim(),
      email: input.email,
      updatedAt: now,
    })
    .where(eq(citizenAccounts.id, id))
    .returning({
      id: citizenAccounts.id,
      phone: citizenAccounts.phone,
      fullName: citizenAccounts.fullName,
      cccd: citizenAccounts.cccd,
      address: citizenAccounts.address,
      email: citizenAccounts.email,
    });
  if (!row) throw new Error("Không cập nhật được tài khoản.");
  return row;
}

export async function setCitizenAccountActiveById(
  id: string,
  isActive: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(citizenAccounts)
    .set({ isActive, updatedAt: now })
    .where(eq(citizenAccounts.id, id));
}

/** Xóa tài khoản công dân; FK liên quan (phản ánh, đánh giá, push token) được SET NULL. */
export async function deleteCitizenAccountById(id: string): Promise<void> {
  await getDb().delete(citizenAccounts).where(eq(citizenAccounts.id, id));
}
