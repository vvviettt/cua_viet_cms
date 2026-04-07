import { and, asc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { staffMemberRatings, staffMembers } from "@/lib/db/schema";

export function currentMonthKey(now = new Date()): string {
  // YYYY-MM (UTC)
  return now.toISOString().slice(0, 7);
}

/** Bỏ ký tự đặc biệt của ILIKE để tránh pattern injection. */
function sanitizeSearchFragment(raw: string): string {
  return raw.replace(/[%_\\]/g, "").trim();
}

export async function listActiveStaffMembersPublic(opts?: {
  query?: string;
}): Promise<
  {
    id: string;
    fullName: string;
    jobTitle: string;
    avatarRelativePath: string | null;
    contactEmail: string | null;
    sortOrder: number;
  }[]
> {
  const fragment = sanitizeSearchFragment(opts?.query ?? "");
  const searchPattern = fragment.length > 0 ? `%${fragment}%` : null;
  const searchWhere =
    searchPattern != null
      ? or(
          ilike(staffMembers.fullName, searchPattern),
          ilike(staffMembers.jobTitle, searchPattern),
        )
      : undefined;

  const rows = await getDb()
    .select({
      id: staffMembers.id,
      fullName: staffMembers.fullName,
      jobTitle: staffMembers.jobTitle,
      avatarRelativePath: staffMembers.avatarRelativePath,
      contactEmail: staffMembers.contactEmail,
      sortOrder: staffMembers.sortOrder,
    })
    .from(staffMembers)
    .where(
      searchWhere
        ? and(eq(staffMembers.isActive, true), searchWhere)
        : eq(staffMembers.isActive, true),
    )
    .orderBy(asc(staffMembers.sortOrder), asc(staffMembers.fullName));

  return rows.map((r) => ({
    ...r,
    avatarRelativePath: r.avatarRelativePath ?? null,
    contactEmail: r.contactEmail ?? null,
  }));
}

export async function createStaffMemberRatingOncePerMonth(values: {
  citizenAccountId: string;
  staffMemberId: string;
  stars: number;
  detail: string | null;
  now?: Date;
}): Promise<string> {
  const now = values.now ?? new Date();
  const monthKey = currentMonthKey(now);
  const createdAt = now.toISOString();
  const [row] = await getDb()
    .insert(staffMemberRatings)
    .values({
      citizenAccountId: values.citizenAccountId,
      staffMemberId: values.staffMemberId,
      stars: values.stars,
      detail: values.detail,
      monthKey,
      createdAt,
    })
    .returning({ id: staffMemberRatings.id });

  if (!row) {
    throw new Error("Không thể tạo đánh giá.");
  }
  return row.id;
}

export async function findMyStaffRatingThisMonth(opts: {
  citizenAccountId: string;
  staffMemberId: string;
  now?: Date;
}): Promise<{ id: string } | null> {
  const monthKey = currentMonthKey(opts.now ?? new Date());
  const [row] = await getDb()
    .select({ id: staffMemberRatings.id })
    .from(staffMemberRatings)
    .where(
      and(
        eq(staffMemberRatings.citizenAccountId, opts.citizenAccountId),
        eq(staffMemberRatings.staffMemberId, opts.staffMemberId),
        eq(staffMemberRatings.monthKey, monthKey),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function listMyRatedStaffIdsThisMonth(opts: {
  citizenAccountId: string;
  now?: Date;
}): Promise<string[]> {
  const monthKey = currentMonthKey(opts.now ?? new Date());
  const rows = await getDb()
    .select({ staffMemberId: staffMemberRatings.staffMemberId })
    .from(staffMemberRatings)
    .where(
      and(
        eq(staffMemberRatings.citizenAccountId, opts.citizenAccountId),
        eq(staffMemberRatings.monthKey, monthKey),
      ),
    );
  return rows.map((r) => r.staffMemberId);
}

