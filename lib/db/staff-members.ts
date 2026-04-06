import { asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { staffMembers } from "@/lib/db/schema";
import type { StaffMemberPublic } from "@/lib/staff-members/types";

export const STAFF_LIST_PAGE_SIZE = 12;

function toPublic(row: typeof staffMembers.$inferSelect): StaffMemberPublic {
  return {
    id: row.id,
    fullName: row.fullName,
    dateOfBirth: row.dateOfBirth ?? null,
    jobTitle: row.jobTitle,
    avatarRelativePath: row.avatarRelativePath ?? null,
    contactEmail: row.contactEmail ?? null,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

/** Bỏ ký tự đặc biệt của ILIKE để tránh pattern injection. */
function sanitizeSearchFragment(raw: string): string {
  return raw.replace(/[%_\\]/g, "").trim();
}

export async function listStaffMembersPaginated(opts: {
  page: number;
  pageSize: number;
  query?: string;
}): Promise<{
  items: StaffMemberPublic[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const db = getDb();
  const fragment = sanitizeSearchFragment(opts.query ?? "");
  const searchPattern = fragment.length > 0 ? `%${fragment}%` : null;

  const searchWhere =
    searchPattern != null
      ? or(
          ilike(staffMembers.fullName, searchPattern),
          ilike(staffMembers.jobTitle, searchPattern),
        )
      : undefined;

  const countBase = db.select({ c: count() }).from(staffMembers);
  const [countRow] = searchWhere
    ? await countBase.where(searchWhere)
    : await countBase;

  const total = Number(countRow?.c ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / opts.pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, opts.page), totalPages);
  const offset = totalPages === 0 ? 0 : (safePage - 1) * opts.pageSize;

  const rows = searchWhere
    ? await db
        .select()
        .from(staffMembers)
        .where(searchWhere)
        .orderBy(
          desc(staffMembers.isActive),
          asc(staffMembers.sortOrder),
          asc(staffMembers.fullName),
        )
        .limit(opts.pageSize)
        .offset(offset)
    : await db
        .select()
        .from(staffMembers)
        .orderBy(
          desc(staffMembers.isActive),
          asc(staffMembers.sortOrder),
          asc(staffMembers.fullName),
        )
        .limit(opts.pageSize)
        .offset(offset);

  return {
    items: rows.map(toPublic),
    total,
    page: safePage,
    pageSize: opts.pageSize,
  };
}

export async function insertStaffMember(values: {
  fullName: string;
  dateOfBirth: string | null;
  jobTitle: string;
  avatarRelativePath: string | null;
  contactEmail: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(staffMembers)
    .values({
      fullName: values.fullName,
      dateOfBirth: values.dateOfBirth ?? null,
      jobTitle: values.jobTitle,
      avatarRelativePath: values.avatarRelativePath,
      contactEmail: values.contactEmail,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: staffMembers.id });

  if (!row) {
    throw new Error("Không thể tạo cán bộ.");
  }
  return row.id;
}

export async function findStaffMemberById(id: string): Promise<StaffMemberPublic | null> {
  const [row] = await getDb().select().from(staffMembers).where(eq(staffMembers.id, id)).limit(1);
  return row ? toPublic(row) : null;
}

export async function updateStaffMemberById(
  id: string,
  values: {
    fullName: string;
    dateOfBirth: string | null;
    jobTitle: string;
    avatarRelativePath: string | null;
    contactEmail: string | null;
    sortOrder: number;
    isActive: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(staffMembers)
    .set({
      fullName: values.fullName,
      dateOfBirth: values.dateOfBirth ?? null,
      jobTitle: values.jobTitle,
      avatarRelativePath: values.avatarRelativePath,
      contactEmail: values.contactEmail,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      updatedAt: now,
    })
    .where(eq(staffMembers.id, id));
}
