import { desc, eq } from "drizzle-orm";
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
}): Promise<string> {
  const now = new Date().toISOString();
  const inserted = await getDb()
    .insert(users)
    .values({
      email: params.email,
      passwordHash: params.passwordHash,
      fullName: params.fullName,
      isAdmin: false,
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
