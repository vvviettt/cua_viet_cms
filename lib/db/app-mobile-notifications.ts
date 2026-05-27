import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { AppMobileNotificationCategory } from "@/lib/app-mobile-notifications/constants";
import { appMobileNotifications } from "@/lib/db/schema";

export type AppMobileNotificationRow = typeof appMobileNotifications.$inferSelect;

export const NOTIFICATION_LIST_PAGE_SIZE = 10;

export async function listAppMobileNotificationsPaginated(opts: {
  page: number;
  pageSize: number;
}): Promise<{
  items: AppMobileNotificationRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const db = getDb();
  const [countRow] = await db.select({ c: count() }).from(appMobileNotifications);
  const total = Number(countRow?.c ?? 0);
  const totalPages = total === 0 ? 0 : Math.ceil(total / opts.pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, opts.page), totalPages);
  const offset = totalPages === 0 ? 0 : (safePage - 1) * opts.pageSize;

  const items = await db
    .select()
    .from(appMobileNotifications)
    .orderBy(desc(appMobileNotifications.createdAt))
    .limit(opts.pageSize)
    .offset(offset);

  return {
    items,
    total,
    page: safePage,
    pageSize: opts.pageSize,
  };
}

export async function findAppMobileNotificationById(
  id: string,
): Promise<AppMobileNotificationRow | null> {
  const [row] = await getDb()
    .select()
    .from(appMobileNotifications)
    .where(eq(appMobileNotifications.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertAppMobileNotification(values: {
  category: AppMobileNotificationCategory;
  title: string;
  content: string;
  sentAt: string | null;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileNotifications)
    .values({
      category: values.category,
      title: values.title,
      content: values.content,
      sentAt: values.sentAt,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileNotifications.id });
  if (!row) throw new Error("Không thể thêm thông báo.");
  return row.id;
}

export async function updateAppMobileNotification(
  id: string,
  values: {
    category: AppMobileNotificationCategory;
    title: string;
    content: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileNotifications)
    .set({
      category: values.category,
      title: values.title,
      content: values.content,
      updatedAt: now,
    })
    .where(eq(appMobileNotifications.id, id));
}

export async function markAppMobileNotificationSent(id: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileNotifications)
    .set({ sentAt: now, updatedAt: now })
    .where(eq(appMobileNotifications.id, id));
}

export async function deleteAppMobileNotification(id: string): Promise<boolean> {
  const existing = await findAppMobileNotificationById(id);
  if (!existing) return false;
  await getDb().delete(appMobileNotifications).where(eq(appMobileNotifications.id, id));
  return true;
}

const sentOnly = isNotNull(appMobileNotifications.sentAt);

/** Thông báo đã gửi — hiển thị trên app (phân trang offset). */
export async function listAppMobileNotificationsPublicPaged(opts: {
  limit: number;
  offset: number;
}): Promise<AppMobileNotificationRow[]> {
  return getDb()
    .select()
    .from(appMobileNotifications)
    .where(sentOnly)
    .orderBy(desc(appMobileNotifications.sentAt))
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function findAppMobileNotificationPublicById(
  id: string,
): Promise<AppMobileNotificationRow | null> {
  const [row] = await getDb()
    .select()
    .from(appMobileNotifications)
    .where(and(eq(appMobileNotifications.id, id), sentOnly))
    .limit(1);
  return row ?? null;
}
