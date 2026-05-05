import { and, count, desc, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getUserByEmailForAuth(email: string) {
  const normalized = email.trim().toLowerCase();
  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  return row ?? null;
}

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listAdminUsers(): Promise<AdminUserListItem[]> {
  return await getDb()
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      isAdmin: users.isAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function getUserById(userId: string): Promise<AdminUserListItem | null> {
  const [row] = await getDb()
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      isAdmin: users.isAdmin,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ?? null;
}

/** Số tài khoản đang có is_admin = true. */
export async function countAdminUsers(): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(users)
    .where(eq(users.isAdmin, true));
  return Number(row?.n ?? 0);
}

export async function emailTakenByOtherUser(email: string, excludeUserId: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const [row] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, normalized), ne(users.id, excludeUserId)))
    .limit(1);
  return row != null;
}

export async function setUserActiveById(userId: string, isActive: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(users)
    .set({ isActive, updatedAt: now })
    .where(eq(users.id, userId));
}

export async function getUserIsAdminById(userId: string): Promise<boolean | null> {
  const [row] = await getDb()
    .select({ isAdmin: users.isAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!row) return null;
  return row.isAdmin;
}

export async function insertCmsUser(params: {
  email: string;
  passwordHash: string;
  fullName: string | null;
  isAdmin?: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const inserted = await getDb()
    .insert(users)
    .values({
      email: params.email,
      passwordHash: params.passwordHash,
      fullName: params.fullName,
      isAdmin: params.isAdmin === true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: users.id });
  const id = inserted[0]?.id;
  if (!id) {
    throw new Error("Không tạo được tài khoản.");
  }
  return id;
}

export async function updateCmsUserProfile(params: {
  userId: string;
  email: string;
  fullName: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(users)
    .set({
      email: params.email.trim().toLowerCase(),
      fullName: params.fullName,
      updatedAt: now,
    })
    .where(eq(users.id, params.userId));
}

export async function updateCmsUserPasswordHash(userId: string, passwordHash: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(users)
    .set({ passwordHash, updatedAt: now })
    .where(eq(users.id, userId));
}

export async function setUserIsAdminFlag(userId: string, isAdmin: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb().update(users).set({ isAdmin, updatedAt: now }).where(eq(users.id, userId));
}

export async function deleteUserById(userId: string): Promise<void> {
  await getDb().delete(users).where(eq(users.id, userId));
}
