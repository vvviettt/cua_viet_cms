import { asc, desc, eq } from "drizzle-orm";

import { appMobileRssFeeds } from "./schema";
import { getDb } from "./index";

export type AppMobileRssFeedRow = typeof appMobileRssFeeds.$inferSelect;

export type PublicAppMobileRssFeed = {
  id: string;
  label: string;
  feedUrl: string;
  sortOrder: number;
};

export async function listAppMobileRssFeedsForCms(): Promise<AppMobileRssFeedRow[]> {
  return getDb()
    .select()
    .from(appMobileRssFeeds)
    .orderBy(asc(appMobileRssFeeds.sortOrder), asc(appMobileRssFeeds.label));
}

export async function listAppMobileRssFeedsPublic(): Promise<PublicAppMobileRssFeed[]> {
  const rows = await getDb()
    .select()
    .from(appMobileRssFeeds)
    .where(eq(appMobileRssFeeds.isActive, true))
    .orderBy(asc(appMobileRssFeeds.sortOrder), asc(appMobileRssFeeds.label));
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    feedUrl: r.feedUrl,
    sortOrder: r.sortOrder,
  }));
}

export async function findAppMobileRssFeedById(id: string): Promise<AppMobileRssFeedRow | null> {
  const [row] = await getDb()
    .select()
    .from(appMobileRssFeeds)
    .where(eq(appMobileRssFeeds.id, id))
    .limit(1);
  return row ?? null;
}

export async function nextAppMobileRssFeedSortOrder(): Promise<number> {
  const [row] = await getDb()
    .select({ sortOrder: appMobileRssFeeds.sortOrder })
    .from(appMobileRssFeeds)
    .orderBy(desc(appMobileRssFeeds.sortOrder))
    .limit(1);
  return (row?.sortOrder ?? -1) + 1;
}

export async function insertAppMobileRssFeed(values: {
  label: string;
  feedUrl: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileRssFeeds)
    .values({
      label: values.label,
      feedUrl: values.feedUrl,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileRssFeeds.id });
  if (!row) throw new Error("Không thể thêm nguồn RSS.");
  return row.id;
}

export async function setAppMobileRssFeedActive(id: string, isActive: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileRssFeeds)
    .set({ isActive, updatedAt: now })
    .where(eq(appMobileRssFeeds.id, id));
}

export async function deleteAppMobileRssFeed(id: string): Promise<void> {
  await getDb().delete(appMobileRssFeeds).where(eq(appMobileRssFeeds.id, id));
}

export async function moveAppMobileRssFeedRelative(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  const rows = await listAppMobileRssFeedsForCms();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[swapIdx]!;
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileRssFeeds)
    .set({ sortOrder: b.sortOrder, updatedAt: now })
    .where(eq(appMobileRssFeeds.id, a.id));
  await getDb()
    .update(appMobileRssFeeds)
    .set({ sortOrder: a.sortOrder, updatedAt: now })
    .where(eq(appMobileRssFeeds.id, b.id));
}
