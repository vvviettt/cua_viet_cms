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
  role: "admin" | "editor" | "viewer";
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
      role: users.role,
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
