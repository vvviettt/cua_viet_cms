import { count, desc, eq, ilike, or } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { citizenAccounts, citizenFeedback, users } from "@/lib/db/schema";
import type {
  CitizenFeedbackKind,
  CitizenFeedbackRecord,
  CitizenFeedbackStatus,
} from "@/lib/citizen-feedback/types";

export const CITIZEN_FEEDBACK_PAGE_SIZE = 15;

function answererDisplayName(fullName: string | null, email: string | null): string | null {
  const n = fullName?.trim();
  if (n) return n;
  if (email?.trim()) return email.trim();
  return null;
}

function toRecord(
  row: typeof citizenFeedback.$inferSelect,
  account: { fullName: string; phone: string; email: string | null },
  answerer: { fullName: string | null; email: string | null },
): CitizenFeedbackRecord {
  const answeredByUserId = row.answeredByUserId ?? null;
  return {
    id: row.id,
    kind: row.kind as CitizenFeedbackKind,
    title: row.title,
    content: row.content,
    citizenAccountId: row.citizenAccountId,
    accountFullName: account.fullName,
    accountPhone: account.phone,
    accountEmail: account.email,
    status: row.status as CitizenFeedbackStatus,
    answeredByUserId,
    answeredByName:
      answeredByUserId == null ? null : answererDisplayName(answerer.fullName, answerer.email),
    staffReply: row.staffReply ?? null,
    hiddenFromApp: row.hiddenFromApp,
    adminNote: row.adminNote ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function sanitizeSearchFragment(raw: string): string {
  return raw.replace(/[%_\\]/g, "").trim();
}

export async function listCitizenFeedbackPaginated(opts: {
  page: number;
  pageSize: number;
  query?: string;
}): Promise<{
  items: CitizenFeedbackRecord[];
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
          ilike(citizenFeedback.title, searchPattern),
          ilike(citizenFeedback.content, searchPattern),
          ilike(citizenAccounts.fullName, searchPattern),
          ilike(citizenAccounts.phone, searchPattern),
          ilike(citizenAccounts.email, searchPattern),
        )
      : undefined;

  const countBase = db
    .select({ c: count() })
    .from(citizenFeedback)
    .innerJoin(citizenAccounts, eq(citizenFeedback.citizenAccountId, citizenAccounts.id));
  const [countRow] = searchWhere
    ? await countBase.where(searchWhere)
    : await countBase;

  const total = Number(countRow?.c ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / opts.pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, opts.page), totalPages);
  const offset = totalPages === 0 ? 0 : (safePage - 1) * opts.pageSize;

  const listBase = db
    .select({
      row: citizenFeedback,
      accFullName: citizenAccounts.fullName,
      accPhone: citizenAccounts.phone,
      accEmail: citizenAccounts.email,
      ansFullName: users.fullName,
      ansEmail: users.email,
    })
    .from(citizenFeedback)
    .innerJoin(citizenAccounts, eq(citizenFeedback.citizenAccountId, citizenAccounts.id))
    .leftJoin(users, eq(citizenFeedback.answeredByUserId, users.id));

  const rows = searchWhere
    ? await listBase
        .where(searchWhere)
        .orderBy(desc(citizenFeedback.createdAt))
        .limit(opts.pageSize)
        .offset(offset)
    : await listBase
        .orderBy(desc(citizenFeedback.createdAt))
        .limit(opts.pageSize)
        .offset(offset);

  return {
    items: rows.map((r) =>
      toRecord(
        r.row,
        { fullName: r.accFullName, phone: r.accPhone, email: r.accEmail ?? null },
        { fullName: r.ansFullName, email: r.ansEmail },
      ),
    ),
    total,
    page: safePage,
    pageSize: opts.pageSize,
  };
}

export async function findCitizenFeedbackById(id: string): Promise<CitizenFeedbackRecord | null> {
  const [r] = await getDb()
    .select({
      row: citizenFeedback,
      accFullName: citizenAccounts.fullName,
      accPhone: citizenAccounts.phone,
      accEmail: citizenAccounts.email,
      ansFullName: users.fullName,
      ansEmail: users.email,
    })
    .from(citizenFeedback)
    .innerJoin(citizenAccounts, eq(citizenFeedback.citizenAccountId, citizenAccounts.id))
    .leftJoin(users, eq(citizenFeedback.answeredByUserId, users.id))
    .where(eq(citizenFeedback.id, id))
    .limit(1);
  return r
    ? toRecord(
        r.row,
        { fullName: r.accFullName, phone: r.accPhone, email: r.accEmail ?? null },
        { fullName: r.ansFullName, email: r.ansEmail },
      )
    : null;
}

export async function insertCitizenFeedback(values: {
  kind: CitizenFeedbackKind;
  title: string;
  content: string;
  citizenAccountId: string;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(citizenFeedback)
    .values({
      kind: values.kind,
      title: values.title,
      content: values.content,
      citizenAccountId: values.citizenAccountId,
      status: "received",
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: citizenFeedback.id });

  if (!row) throw new Error("Không thể tạo bản ghi phản ánh.");
  return row.id;
}

export async function updateCitizenFeedbackAdminFields(
  id: string,
  values: {
    status: CitizenFeedbackStatus;
    adminNote: string | null;
    hiddenFromApp: boolean;
    answeredByUserId?: string | null;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const patch: {
    status: CitizenFeedbackStatus;
    adminNote: string | null;
    hiddenFromApp: boolean;
    updatedAt: string;
    answeredByUserId?: string | null;
  } = {
    status: values.status,
    adminNote: values.adminNote,
    hiddenFromApp: values.hiddenFromApp,
    updatedAt: now,
  };
  if ("answeredByUserId" in values) {
    patch.answeredByUserId = values.answeredByUserId;
  }
  await getDb().update(citizenFeedback).set(patch).where(eq(citizenFeedback.id, id));
}

export async function updateCitizenFeedbackStaffReply(
  id: string,
  values: { staffReply: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(citizenFeedback)
    .set({
      staffReply: values.staffReply,
      updatedAt: now,
    })
    .where(eq(citizenFeedback.id, id));
}
