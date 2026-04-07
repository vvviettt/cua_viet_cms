import { asc, eq, max } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { newsArticleCategories } from "@/lib/db/schema";

export type NewsArticleCategoryRow = typeof newsArticleCategories.$inferSelect;

export async function listNewsArticleCategories(): Promise<NewsArticleCategoryRow[]> {
  return getDb()
    .select()
    .from(newsArticleCategories)
    .orderBy(asc(newsArticleCategories.sortOrder), asc(newsArticleCategories.title));
}

export async function findNewsArticleCategoryById(id: string): Promise<NewsArticleCategoryRow | null> {
  const [row] = await getDb()
    .select()
    .from(newsArticleCategories)
    .where(eq(newsArticleCategories.id, id))
    .limit(1);
  return row ?? null;
}

export async function findNewsArticleCategoryByTitle(title: string): Promise<NewsArticleCategoryRow | null> {
  const [row] = await getDb()
    .select()
    .from(newsArticleCategories)
    .where(eq(newsArticleCategories.title, title))
    .limit(1);
  return row ?? null;
}

/** Tạo danh mục hoặc trả về id nếu đã có cùng tiêu đề (so khớp chính xác sau trim). */
export async function insertNewsArticleCategoryOrGetExisting(title: string): Promise<string> {
  const trimmed = title.trim();
  const existing = await findNewsArticleCategoryByTitle(trimmed);
  if (existing) return existing.id;

  const now = new Date().toISOString();
  const [maxRow] = await getDb()
    .select({ m: max(newsArticleCategories.sortOrder) })
    .from(newsArticleCategories);
  const nextOrder = Number(maxRow?.m ?? 0) + 10;

  const [row] = await getDb()
    .insert(newsArticleCategories)
    .values({
      title: trimmed,
      sortOrder: nextOrder,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: newsArticleCategories.id });

  if (!row) throw new Error("Không thể tạo danh mục.");
  return row.id;
}
