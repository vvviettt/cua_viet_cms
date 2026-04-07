import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { files, newsArticleCategories, newsArticles, users } from "@/lib/db/schema";

export type NewsArticleRow = typeof newsArticles.$inferSelect;

export type NewsArticleListRow = NewsArticleRow & {
  bannerRelativePath: string;
  authorEmail: string;
  authorFullName: string | null;
  categoryTitle: string;
};

export async function listNewsArticlesForCms(): Promise<NewsArticleListRow[]> {
  const rows = await getDb()
    .select({
      article: newsArticles,
      bannerRelativePath: files.relativePath,
      authorEmail: users.email,
      authorFullName: users.fullName,
      categoryTitle: newsArticleCategories.title,
    })
    .from(newsArticles)
    .innerJoin(files, eq(newsArticles.bannerFileId, files.id))
    .innerJoin(users, eq(newsArticles.createdByUserId, users.id))
    .innerJoin(newsArticleCategories, eq(newsArticles.categoryId, newsArticleCategories.id))
    .orderBy(desc(newsArticles.createdAt));

  return rows.map((r) => ({
    ...r.article,
    bannerRelativePath: r.bannerRelativePath,
    authorEmail: r.authorEmail,
    authorFullName: r.authorFullName,
    categoryTitle: r.categoryTitle ?? "",
  }));
}

export async function listNewsArticlesVisiblePublic(): Promise<NewsArticleListRow[]> {
  const rows = await getDb()
    .select({
      article: newsArticles,
      bannerRelativePath: files.relativePath,
      authorEmail: users.email,
      authorFullName: users.fullName,
      categoryTitle: newsArticleCategories.title,
    })
    .from(newsArticles)
    .innerJoin(files, eq(newsArticles.bannerFileId, files.id))
    .innerJoin(users, eq(newsArticles.createdByUserId, users.id))
    .innerJoin(newsArticleCategories, eq(newsArticles.categoryId, newsArticleCategories.id))
    .where(eq(newsArticles.isVisible, true))
    .orderBy(desc(newsArticles.createdAt));

  return rows.map((r) => ({
    ...r.article,
    bannerRelativePath: r.bannerRelativePath,
    authorEmail: r.authorEmail,
    authorFullName: r.authorFullName,
    categoryTitle: r.categoryTitle ?? "",
  }));
}

/** Tin hiển thị công khai, phân trang (mới nhất trước). */
export async function listNewsArticlesVisiblePublicPaged(params: {
  limit: number;
  offset: number;
}): Promise<NewsArticleListRow[]> {
  const { limit, offset } = params;
  const rows = await getDb()
    .select({
      article: newsArticles,
      bannerRelativePath: files.relativePath,
      authorEmail: users.email,
      authorFullName: users.fullName,
      categoryTitle: newsArticleCategories.title,
    })
    .from(newsArticles)
    .innerJoin(files, eq(newsArticles.bannerFileId, files.id))
    .innerJoin(users, eq(newsArticles.createdByUserId, users.id))
    .innerJoin(newsArticleCategories, eq(newsArticles.categoryId, newsArticleCategories.id))
    .where(eq(newsArticles.isVisible, true))
    .orderBy(desc(newsArticles.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({
    ...r.article,
    bannerRelativePath: r.bannerRelativePath,
    authorEmail: r.authorEmail,
    authorFullName: r.authorFullName,
    categoryTitle: r.categoryTitle ?? "",
  }));
}

export async function findNewsArticleById(id: string): Promise<NewsArticleListRow | null> {
  const [row] = await getDb()
    .select({
      article: newsArticles,
      bannerRelativePath: files.relativePath,
      authorEmail: users.email,
      authorFullName: users.fullName,
      categoryTitle: newsArticleCategories.title,
    })
    .from(newsArticles)
    .innerJoin(files, eq(newsArticles.bannerFileId, files.id))
    .innerJoin(users, eq(newsArticles.createdByUserId, users.id))
    .innerJoin(newsArticleCategories, eq(newsArticles.categoryId, newsArticleCategories.id))
    .where(eq(newsArticles.id, id))
    .limit(1);

  if (!row) return null;
  return {
    ...row.article,
    bannerRelativePath: row.bannerRelativePath,
    authorEmail: row.authorEmail,
    authorFullName: row.authorFullName,
    categoryTitle: row.categoryTitle ?? "",
  };
}

export async function findNewsArticleVisibleById(id: string): Promise<NewsArticleListRow | null> {
  const [row] = await getDb()
    .select({
      article: newsArticles,
      bannerRelativePath: files.relativePath,
      authorEmail: users.email,
      authorFullName: users.fullName,
      categoryTitle: newsArticleCategories.title,
    })
    .from(newsArticles)
    .innerJoin(files, eq(newsArticles.bannerFileId, files.id))
    .innerJoin(users, eq(newsArticles.createdByUserId, users.id))
    .innerJoin(newsArticleCategories, eq(newsArticles.categoryId, newsArticleCategories.id))
    .where(and(eq(newsArticles.id, id), eq(newsArticles.isVisible, true)))
    .limit(1);

  if (!row) return null;
  return {
    ...row.article,
    bannerRelativePath: row.bannerRelativePath,
    authorEmail: row.authorEmail,
    authorFullName: row.authorFullName,
    categoryTitle: row.categoryTitle ?? "",
  };
}

export async function insertNewsArticle(values: {
  title: string;
  categoryId: string;
  bannerFileId: string;
  contentJson: string;
  createdByUserId: string;
  isVisible: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(newsArticles)
    .values({
      title: values.title,
      categoryId: values.categoryId,
      bannerFileId: values.bannerFileId,
      contentJson: values.contentJson,
      createdByUserId: values.createdByUserId,
      isVisible: values.isVisible,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: newsArticles.id });
  if (!row) throw new Error("Không thể thêm tin tức.");
  return row.id;
}

export async function updateNewsArticle(
  id: string,
  values: {
    title: string;
    categoryId: string;
    bannerFileId: string;
    contentJson: string;
    isVisible: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(newsArticles)
    .set({
      title: values.title,
      categoryId: values.categoryId,
      bannerFileId: values.bannerFileId,
      contentJson: values.contentJson,
      isVisible: values.isVisible,
      updatedAt: now,
    })
    .where(eq(newsArticles.id, id));
}

export async function deleteNewsArticleById(id: string): Promise<void> {
  await getDb().delete(newsArticles).where(eq(newsArticles.id, id));
}
