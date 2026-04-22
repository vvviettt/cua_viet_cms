import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { appMobileFaqs, appMobileSettings } from "@/lib/db/schema";

export type AppMobileSettingsRow = typeof appMobileSettings.$inferSelect;
export type AppMobileFaqRow = typeof appMobileFaqs.$inferSelect;

const DEFAULT_EDITOR_JSON = '{"blocks":[]}';

export async function getAppMobileSettingsRow(): Promise<AppMobileSettingsRow | null> {
  const [row] = await getDb().select().from(appMobileSettings).limit(1);
  return row ?? null;
}

/** Tạo bản ghi settings mặc định nếu chưa có. */
export async function ensureAppMobileSettingsRow(): Promise<AppMobileSettingsRow> {
  const existing = await getAppMobileSettingsRow();
  if (existing) return existing;
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileSettings)
    .values({
      allowCitizenRegister: true,
      supportHotline: null,
      usageGuideJson: DEFAULT_EDITOR_JSON,
      termsJson: DEFAULT_EDITOR_JSON,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("Không thể tạo cài đặt ứng dụng.");
  return row;
}

export async function getAppMobileSettingsForCms(): Promise<AppMobileSettingsRow> {
  return ensureAppMobileSettingsRow();
}

export async function updateAppMobileSettings(values: {
  allowCitizenRegister: boolean;
  supportHotline: string | null;
  usageGuideJson: string;
  termsJson: string;
}): Promise<void> {
  const row = await ensureAppMobileSettingsRow();
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileSettings)
    .set({
      allowCitizenRegister: values.allowCitizenRegister,
      supportHotline: values.supportHotline,
      usageGuideJson: values.usageGuideJson,
      termsJson: values.termsJson,
      updatedAt: now,
    })
    .where(eq(appMobileSettings.id, row.id));
}

export async function listAppMobileFaqsForCms(): Promise<AppMobileFaqRow[]> {
  return getDb()
    .select()
    .from(appMobileFaqs)
    .orderBy(asc(appMobileFaqs.sortOrder), asc(appMobileFaqs.question));
}

export async function listAppMobileFaqsPublic(): Promise<AppMobileFaqRow[]> {
  return getDb()
    .select()
    .from(appMobileFaqs)
    .where(eq(appMobileFaqs.isActive, true))
    .orderBy(asc(appMobileFaqs.sortOrder), asc(appMobileFaqs.question));
}

export async function insertAppMobileFaq(values: {
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileFaqs)
    .values({
      question: values.question,
      answer: values.answer,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileFaqs.id });
  if (!row) throw new Error("Không thể thêm câu hỏi.");
  return row.id;
}

export async function updateAppMobileFaq(
  id: string,
  values: { question: string; answer: string; isActive: boolean },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileFaqs)
    .set({
      question: values.question,
      answer: values.answer,
      isActive: values.isActive,
      updatedAt: now,
    })
    .where(eq(appMobileFaqs.id, id));
}

export async function deleteAppMobileFaq(id: string): Promise<void> {
  await getDb().delete(appMobileFaqs).where(eq(appMobileFaqs.id, id));
}

export async function nextAppMobileFaqSortOrder(): Promise<number> {
  const rows = await listAppMobileFaqsForCms();
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.sortOrder)) + 1;
}

export async function moveAppMobileFaqRelative(id: string, direction: "up" | "down"): Promise<void> {
  const rows = await listAppMobileFaqsForCms();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[j]!;
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    await tx
      .update(appMobileFaqs)
      .set({ sortOrder: b.sortOrder, updatedAt: now })
      .where(and(eq(appMobileFaqs.id, a.id)));
    await tx
      .update(appMobileFaqs)
      .set({ sortOrder: a.sortOrder, updatedAt: now })
      .where(and(eq(appMobileFaqs.id, b.id)));
  });
}

