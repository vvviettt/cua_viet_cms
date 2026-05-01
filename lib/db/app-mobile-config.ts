import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  appMobileBanners,
  appMobileHomeBanner,
  appMobileHomeBannerItems,
  appMobileHomeBannerSections,
  appMobileHomeItems,
  appMobileHomeSections,
  appMobileShellTabs,
  appMobileTheme,
  files,
} from "@/lib/db/schema";
import { uploadsPublicHref } from "@/lib/uploads/public-url";
import { listNewsArticlesVisiblePublicPaged } from "@/lib/db/news-articles";
import { ensureAppMobileSettingsRow, listAppMobileFaqsPublic } from "@/lib/db/app-mobile-settings";

type FileRow = typeof files.$inferSelect;

export type AppMobileThemeRow = typeof appMobileTheme.$inferSelect;
export type AppMobileSectionRow = typeof appMobileHomeSections.$inferSelect;
export type AppMobileItemRow = typeof appMobileHomeItems.$inferSelect;

export type AppMobileSectionCmsRow = {
  section: typeof appMobileHomeSections.$inferSelect;
  iconFile: typeof files.$inferSelect | null;
};

export type AppMobileBannerCmsRow = {
  banner: typeof appMobileBanners.$inferSelect;
  file: typeof files.$inferSelect;
};

export type AppHomeBannerPlacement = "top" | "after_section_2";
export type AppHomeBannerCtaKey = "apply_online" | "lookup_result";

export type AppMobileHomeBannerRow = typeof appMobileHomeBanner.$inferSelect;
export type AppMobileHomeBannerSectionRow = typeof appMobileHomeBannerSections.$inferSelect;
export type AppMobileHomeBannerItemRow = typeof appMobileHomeBannerItems.$inferSelect;

export async function getAppMobileThemeRow(): Promise<AppMobileThemeRow | null> {
  const [row] = await getDb().select().from(appMobileTheme).limit(1);
  return row ?? null;
}

/** Tạo bản ghi theme mặc định nếu chưa có (seed / lần đầu vào CMS). */
export async function ensureAppMobileThemeRow(): Promise<AppMobileThemeRow> {
  const existing = await getAppMobileThemeRow();
  if (existing) return existing;
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileTheme)
    .values({
      primarySeedHex: "#0D47A1",
      homeHeroTitle: "Chuyên trang chuyển đổi số\nXã Cửa Việt",
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("Không thể tạo cấu hình theme.");
  return row;
}

export async function getAppMobileHomeBannerRow(): Promise<AppMobileHomeBannerRow | null> {
  const [row] = await getDb().select().from(appMobileHomeBanner).limit(1);
  return row ?? null;
}

/** Tạo bản ghi banner đầu trang mặc định nếu chưa có. */
export async function ensureAppMobileHomeBannerRow(): Promise<AppMobileHomeBannerRow> {
  const existing = await getAppMobileHomeBannerRow();
  if (existing) return existing;
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileHomeBanner)
    .values({
      title: "CỬA VIỆT SỐ",
      subtitle: "CHUYỂN ĐỔI SỐ XÃ CỬA VIỆT",
      applyLabel: "Nộp hồ sơ trực tuyến",
      lookupLabel: "Tra cứu kết quả",
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("Không thể tạo cấu hình banner đầu trang.");
  return row;
}

export async function listAppMobileHomeBannerSectionsForCms(ctaKey: AppHomeBannerCtaKey): Promise<AppMobileHomeBannerSectionRow[]> {
  return getDb()
    .select()
    .from(appMobileHomeBannerSections)
    .where(eq(appMobileHomeBannerSections.ctaKey, ctaKey))
    .orderBy(asc(appMobileHomeBannerSections.sortOrder), asc(appMobileHomeBannerSections.title));
}

export async function listAppMobileHomeBannerItemsForCms(): Promise<AppMobileHomeBannerItemRow[]> {
  return getDb()
    .select()
    .from(appMobileHomeBannerItems)
    .orderBy(asc(appMobileHomeBannerItems.sortOrder), asc(appMobileHomeBannerItems.label));
}

export async function listAppMobileHomeBannerItemsBySectionOrdered(sectionId: string): Promise<AppMobileHomeBannerItemRow[]> {
  return getDb()
    .select()
    .from(appMobileHomeBannerItems)
    .where(eq(appMobileHomeBannerItems.sectionId, sectionId))
    .orderBy(asc(appMobileHomeBannerItems.sortOrder), asc(appMobileHomeBannerItems.label));
}

export async function nextAppMobileHomeBannerSectionSortOrder(ctaKey: AppHomeBannerCtaKey): Promise<number> {
  const rows = await listAppMobileHomeBannerSectionsForCms(ctaKey);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.sortOrder)) + 1;
}

export async function nextAppMobileHomeBannerItemSortOrderInSection(sectionId: string): Promise<number> {
  const rows = await listAppMobileHomeBannerItemsBySectionOrdered(sectionId);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.sortOrder)) + 1;
}

export async function insertAppMobileHomeBannerSection(values: {
  ctaKey: AppHomeBannerCtaKey;
  title: string;
  iconFileId?: string | null;
  kind: "native" | "webview" | "file";
  routeId: string | null;
  webUrl: string | null;
  documentFileId?: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileHomeBannerSections)
    .values({
      ctaKey: values.ctaKey,
      title: values.title,
      iconFileId: values.iconFileId ?? null,
      kind: values.kind,
      routeId: values.routeId,
      webUrl: values.webUrl,
      documentFileId: values.documentFileId ?? null,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileHomeBannerSections.id });
  if (!row) throw new Error("Không thể thêm nhóm CTA.");
  return row.id;
}

export async function updateAppMobileHomeBannerSectionTitle(
  id: string,
  values: {
    title: string;
    iconFileId: string | null;
    kind: "native" | "webview" | "file";
    routeId: string | null;
    webUrl: string | null;
    documentFileId: string | null;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeBannerSections)
    .set({
      title: values.title,
      iconFileId: values.iconFileId,
      kind: values.kind,
      routeId: values.routeId,
      webUrl: values.webUrl,
      documentFileId: values.documentFileId,
      updatedAt: now,
    })
    .where(eq(appMobileHomeBannerSections.id, id));
}

export async function deleteAppMobileHomeBannerSection(id: string): Promise<void> {
  await getDb().delete(appMobileHomeBannerSections).where(eq(appMobileHomeBannerSections.id, id));
}

export async function moveAppMobileHomeBannerSectionRelative(
  id: string,
  ctaKey: AppHomeBannerCtaKey,
  direction: "up" | "down",
): Promise<void> {
  const rows = await listAppMobileHomeBannerSectionsForCms(ctaKey);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[j]!;
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    await tx
      .update(appMobileHomeBannerSections)
      .set({ sortOrder: b.sortOrder, updatedAt: now })
      .where(eq(appMobileHomeBannerSections.id, a.id));
    await tx
      .update(appMobileHomeBannerSections)
      .set({ sortOrder: a.sortOrder, updatedAt: now })
      .where(eq(appMobileHomeBannerSections.id, b.id));
  });
}

export async function setAppMobileHomeBannerSectionActive(id: string, isActive: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeBannerSections)
    .set({ isActive, updatedAt: now })
    .where(eq(appMobileHomeBannerSections.id, id));
}

export async function findAppMobileHomeBannerSectionById(id: string): Promise<AppMobileHomeBannerSectionRow | null> {
  const [row] = await getDb()
    .select()
    .from(appMobileHomeBannerSections)
    .where(eq(appMobileHomeBannerSections.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertAppMobileHomeBannerItem(values: {
  sectionId: string;
  kind: "native" | "webview";
  routeId: string | null;
  webUrl: string | null;
  label: string;
  iconKey: string;
  iconFileId: string | null;
  accentHex: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileHomeBannerItems)
    .values({
      sectionId: values.sectionId,
      kind: values.kind,
      routeId: values.routeId,
      webUrl: values.webUrl,
      label: values.label,
      iconKey: values.iconKey,
      iconFileId: values.iconFileId,
      accentHex: values.accentHex,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileHomeBannerItems.id });
  if (!row) throw new Error("Không thể thêm mục CTA.");
  return row.id;
}

export async function updateAppMobileHomeBannerItemContent(
  id: string,
  values: {
    kind: "native" | "webview";
    routeId: string | null;
    webUrl: string | null;
    label: string;
    iconKey: string;
    iconFileId: string | null;
    accentHex: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeBannerItems)
    .set({
      kind: values.kind,
      routeId: values.routeId,
      webUrl: values.webUrl,
      label: values.label,
      iconKey: values.iconKey,
      iconFileId: values.iconFileId,
      accentHex: values.accentHex,
      updatedAt: now,
    })
    .where(eq(appMobileHomeBannerItems.id, id));
}

export async function deleteAppMobileHomeBannerItem(id: string): Promise<void> {
  await getDb().delete(appMobileHomeBannerItems).where(eq(appMobileHomeBannerItems.id, id));
}

export async function setAppMobileHomeBannerItemActive(id: string, isActive: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeBannerItems)
    .set({ isActive, updatedAt: now })
    .where(eq(appMobileHomeBannerItems.id, id));
}

export async function moveAppMobileHomeBannerItemRelative(
  itemId: string,
  sectionId: string,
  direction: "up" | "down",
): Promise<void> {
  const rows = await listAppMobileHomeBannerItemsBySectionOrdered(sectionId);
  const idx = rows.findIndex((r) => r.id === itemId);
  if (idx < 0) return;
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[j]!;
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    await tx
      .update(appMobileHomeBannerItems)
      .set({ sortOrder: b.sortOrder, updatedAt: now })
      .where(and(eq(appMobileHomeBannerItems.id, a.id), eq(appMobileHomeBannerItems.sectionId, sectionId)));
    await tx
      .update(appMobileHomeBannerItems)
      .set({ sortOrder: a.sortOrder, updatedAt: now })
      .where(and(eq(appMobileHomeBannerItems.id, b.id), eq(appMobileHomeBannerItems.sectionId, sectionId)));
  });
}

export async function findAppMobileHomeBannerItemById(id: string): Promise<AppMobileHomeBannerItemRow | null> {
  const [row] = await getDb()
    .select()
    .from(appMobileHomeBannerItems)
    .where(eq(appMobileHomeBannerItems.id, id))
    .limit(1);
  return row ?? null;
}

export async function updateAppMobileHomeBanner(values: {
  title: string;
  subtitle: string;
  applyLabel: string;
  lookupLabel: string;
  /** undefined = giữ nguyên cột decoration. */
  decorationFileId?: string | null;
}): Promise<void> {
  const row = await ensureAppMobileHomeBannerRow();
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeBanner)
    .set({
      title: values.title,
      subtitle: values.subtitle,
      applyLabel: values.applyLabel,
      lookupLabel: values.lookupLabel,
      ...(values.decorationFileId !== undefined ? { decorationFileId: values.decorationFileId } : {}),
      updatedAt: now,
    })
    .where(eq(appMobileHomeBanner.id, row.id));
}

const SHELL_TAB_DEFAULTS: readonly { tabKey: string; label: string; sortOrder: number }[] = [
  { tabKey: "home", label: "Trang chủ", sortOrder: 0 },
  { tabKey: "assistant", label: "Trợ lý ảo", sortOrder: 1 },
  { tabKey: "notifications", label: "Thông báo", sortOrder: 2 },
  { tabKey: "profile", label: "Cài đặt", sortOrder: 3 },
] as const;

export type AppMobileShellTabRow = typeof appMobileShellTabs.$inferSelect;

/** Đảm bảo đủ 4 tab cố định (lần đầu hoặc sau migrate). */
export async function ensureAppMobileShellTabsSeeded(): Promise<void> {
  const existing = await getDb().select().from(appMobileShellTabs);
  const byKey = new Map(existing.map((r) => [r.tabKey, r]));
  const now = new Date().toISOString();
  for (const d of SHELL_TAB_DEFAULTS) {
    if (byKey.has(d.tabKey)) continue;
    await getDb().insert(appMobileShellTabs).values({
      tabKey: d.tabKey,
      label: d.label,
      sortOrder: d.sortOrder,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export async function listAppMobileShellTabsForCms(): Promise<AppMobileShellTabRow[]> {
  await ensureAppMobileShellTabsSeeded();
  return getDb()
    .select()
    .from(appMobileShellTabs)
    .orderBy(asc(appMobileShellTabs.sortOrder), asc(appMobileShellTabs.tabKey));
}

export async function setAppMobileShellTabActive(id: string, isActive: boolean): Promise<void> {
  const rows = await listAppMobileShellTabsForCms();
  const activeCount = rows.filter((r) => r.isActive).length;
  const target = rows.find((r) => r.id === id);
  if (!isActive && target?.isActive && activeCount <= 1) {
    throw new Error("Phải giữ ít nhất một tab hiển thị trên ứng dụng.");
  }
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileShellTabs)
    .set({ isActive, updatedAt: now })
    .where(eq(appMobileShellTabs.id, id));
}

export async function moveAppMobileShellTabRelative(id: string, direction: "up" | "down"): Promise<void> {
  const rows = await listAppMobileShellTabsForCms();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[j]!;
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    await tx
      .update(appMobileShellTabs)
      .set({ sortOrder: b.sortOrder, updatedAt: now })
      .where(eq(appMobileShellTabs.id, a.id));
    await tx
      .update(appMobileShellTabs)
      .set({ sortOrder: a.sortOrder, updatedAt: now })
      .where(eq(appMobileShellTabs.id, b.id));
  });
}

export async function updateAppMobileTheme(values: {
  primarySeedHex: string;
  homeHeroTitle: string;
}): Promise<void> {
  const theme = await ensureAppMobileThemeRow();
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileTheme)
    .set({
      primarySeedHex: values.primarySeedHex,
      homeHeroTitle: values.homeHeroTitle,
      updatedAt: now,
    })
    .where(eq(appMobileTheme.id, theme.id));
}

export async function listAppMobileSectionsForCms(): Promise<AppMobileSectionRow[]> {
  return getDb()
    .select()
    .from(appMobileHomeSections)
    .orderBy(asc(appMobileHomeSections.sortOrder), asc(appMobileHomeSections.title));
}

export async function listAppMobileSectionsForCmsWithIcon(): Promise<AppMobileSectionCmsRow[]> {
  return getDb()
    .select({
      section: appMobileHomeSections,
      iconFile: files,
    })
    .from(appMobileHomeSections)
    .leftJoin(files, eq(appMobileHomeSections.iconFileId, files.id))
    .orderBy(asc(appMobileHomeSections.sortOrder), asc(appMobileHomeSections.title));
}

export async function listAppMobileItemsForCms(): Promise<AppMobileItemRow[]> {
  return getDb()
    .select()
    .from(appMobileHomeItems)
    .orderBy(asc(appMobileHomeItems.sortOrder), asc(appMobileHomeItems.label));
}

/** Mục trong một nhóm — dùng sắp xếp kéo thả / mũi tên. */
export async function listAppMobileItemsBySectionOrdered(sectionId: string): Promise<AppMobileItemRow[]> {
  return getDb()
    .select()
    .from(appMobileHomeItems)
    .where(eq(appMobileHomeItems.sectionId, sectionId))
    .orderBy(asc(appMobileHomeItems.sortOrder), asc(appMobileHomeItems.label));
}

export async function nextAppMobileSectionSortOrder(): Promise<number> {
  const rows = await listAppMobileSectionsForCms();
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.sortOrder)) + 1;
}

export async function nextAppMobileBannerSortOrder(placement: AppHomeBannerPlacement): Promise<number> {
  const rows = await listAppMobileBannersForCms(placement);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.banner.sortOrder)) + 1;
}

export async function nextAppMobileItemSortOrderInSection(sectionId: string): Promise<number> {
  const rows = await listAppMobileItemsBySectionOrdered(sectionId);
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.sortOrder)) + 1;
}

export async function moveAppMobileSectionRelative(id: string, direction: "up" | "down"): Promise<void> {
  const rows = await listAppMobileSectionsForCms();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return;
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[j]!;
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    await tx
      .update(appMobileHomeSections)
      .set({ sortOrder: b.sortOrder, updatedAt: now })
      .where(eq(appMobileHomeSections.id, a.id));
    await tx
      .update(appMobileHomeSections)
      .set({ sortOrder: a.sortOrder, updatedAt: now })
      .where(eq(appMobileHomeSections.id, b.id));
  });
}

export async function moveAppMobileItemRelative(
  itemId: string,
  sectionId: string,
  direction: "up" | "down",
): Promise<void> {
  const rows = await listAppMobileItemsBySectionOrdered(sectionId);
  const idx = rows.findIndex((r) => r.id === itemId);
  if (idx < 0) return;
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= rows.length) return;
  const a = rows[idx]!;
  const b = rows[j]!;
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    await tx
      .update(appMobileHomeItems)
      .set({ sortOrder: b.sortOrder, updatedAt: now })
      .where(and(eq(appMobileHomeItems.id, a.id), eq(appMobileHomeItems.sectionId, sectionId)));
    await tx
      .update(appMobileHomeItems)
      .set({ sortOrder: a.sortOrder, updatedAt: now })
      .where(and(eq(appMobileHomeItems.id, b.id), eq(appMobileHomeItems.sectionId, sectionId)));
  });
}

export async function moveAppMobileBannerRelative(
  bannerId: string,
  placement: AppHomeBannerPlacement,
  direction: "up" | "down",
): Promise<void> {
  const rows = await listAppMobileBannersForCms(placement);
  const idx = rows.findIndex((r) => r.banner.id === bannerId);
  if (idx < 0) return;
  const j = direction === "up" ? idx - 1 : idx + 1;
  if (j < 0 || j >= rows.length) return;
  const a = rows[idx]!.banner;
  const b = rows[j]!.banner;
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    await tx
      .update(appMobileBanners)
      .set({ sortOrder: b.sortOrder, updatedAt: now })
      .where(eq(appMobileBanners.id, a.id));
    await tx
      .update(appMobileBanners)
      .set({ sortOrder: a.sortOrder, updatedAt: now })
      .where(eq(appMobileBanners.id, b.id));
  });
}

export async function setAppMobileSectionActive(id: string, isActive: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeSections)
    .set({ isActive, updatedAt: now })
    .where(eq(appMobileHomeSections.id, id));
}

export async function setAppMobileItemActive(id: string, isActive: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeItems)
    .set({ isActive, updatedAt: now })
    .where(eq(appMobileHomeItems.id, id));
}

export async function setAppMobileItemDefaultFavorite(id: string, isDefaultFavorite: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeItems)
    .set({ isDefaultFavorite, updatedAt: now })
    .where(eq(appMobileHomeItems.id, id));
}

export async function setAppMobileBannerActive(id: string, isActive: boolean): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileBanners)
    .set({ isActive, updatedAt: now })
    .where(eq(appMobileBanners.id, id));
}

export async function findAppMobileSectionById(id: string): Promise<AppMobileSectionRow | null> {
  const [row] = await getDb()
    .select()
    .from(appMobileHomeSections)
    .where(eq(appMobileHomeSections.id, id))
    .limit(1);
  return row ?? null;
}

export async function findAppMobileSectionByIdForCms(id: string): Promise<AppMobileSectionCmsRow | null> {
  const [row] = await getDb()
    .select({
      section: appMobileHomeSections,
      iconFile: files,
    })
    .from(appMobileHomeSections)
    .leftJoin(files, eq(appMobileHomeSections.iconFileId, files.id))
    .where(eq(appMobileHomeSections.id, id))
    .limit(1);
  return row ?? null;
}

export async function findAppMobileItemById(id: string): Promise<AppMobileItemRow | null> {
  const [row] = await getDb()
    .select()
    .from(appMobileHomeItems)
    .where(eq(appMobileHomeItems.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertAppMobileSection(values: {
  title: string;
  iconFileId?: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileHomeSections)
    .values({
      title: values.title,
      iconFileId: values.iconFileId ?? null,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileHomeSections.id });
  if (!row) throw new Error("Không thể thêm nhóm menu.");
  return row.id;
}

export async function updateAppMobileSectionTitle(
  id: string,
  values: { title: string; iconFileId: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeSections)
    .set({
      title: values.title,
      iconFileId: values.iconFileId,
      updatedAt: now,
    })
    .where(eq(appMobileHomeSections.id, id));
}

export async function deleteAppMobileSection(id: string): Promise<void> {
  await getDb().delete(appMobileHomeSections).where(eq(appMobileHomeSections.id, id));
}

export async function insertAppMobileItem(values: {
  sectionId: string;
  kind: "native" | "webview" | "file";
  routeId: string | null;
  webUrl: string | null;
  documentFileId: string | null;
  label: string;
  iconKey: string;
  iconFileId: string | null;
  accentHex: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileHomeItems)
    .values({
      sectionId: values.sectionId,
      kind: values.kind,
      routeId: values.routeId,
      webUrl: values.webUrl,
      documentFileId: values.documentFileId,
      label: values.label,
      iconKey: values.iconKey,
      iconFileId: values.iconFileId,
      accentHex: values.accentHex,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileHomeItems.id });
  if (!row) throw new Error("Không thể thêm mục menu.");
  return row.id;
}

/** Cập nhật nội dung mục — thứ tự và bật/tắt chỉnh trên danh sách. */
export async function updateAppMobileItemContent(
  id: string,
  values: {
    kind: "native" | "webview" | "file";
    routeId: string | null;
    webUrl: string | null;
    documentFileId: string | null;
    label: string;
    iconKey: string;
    iconFileId: string | null;
    accentHex: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeItems)
    .set({
      kind: values.kind,
      routeId: values.routeId,
      webUrl: values.webUrl,
      documentFileId: values.documentFileId,
      label: values.label,
      iconKey: values.iconKey,
      iconFileId: values.iconFileId,
      accentHex: values.accentHex,
      updatedAt: now,
    })
    .where(eq(appMobileHomeItems.id, id));
}

export async function deleteAppMobileItem(id: string): Promise<void> {
  await getDb().delete(appMobileHomeItems).where(eq(appMobileHomeItems.id, id));
}

export async function listAppMobileBannersForCms(
  placement: AppHomeBannerPlacement,
): Promise<AppMobileBannerCmsRow[]> {
  const rows = await getDb()
    .select({
      banner: appMobileBanners,
      file: files,
    })
    .from(appMobileBanners)
    .innerJoin(files, eq(appMobileBanners.fileId, files.id))
    .where(eq(appMobileBanners.placement, placement))
    .orderBy(asc(appMobileBanners.sortOrder), asc(appMobileBanners.createdAt));

  return rows;
}

export async function findAppMobileBannerById(id: string): Promise<AppMobileBannerCmsRow | null> {
  const [row] = await getDb()
    .select({
      banner: appMobileBanners,
      file: files,
    })
    .from(appMobileBanners)
    .innerJoin(files, eq(appMobileBanners.fileId, files.id))
    .where(eq(appMobileBanners.id, id))
    .limit(1);
  return row ?? null;
}

export async function insertAppMobileBanner(values: {
  fileId: string;
  placement: AppHomeBannerPlacement;
  redirectUrl?: string | null;
  routePath?: string | null;
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileBanners)
    .values({
      fileId: values.fileId,
      placement: values.placement,
      redirectUrl: values.redirectUrl ?? null,
      routePath: values.routePath ?? null,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileBanners.id });
  if (!row) throw new Error("Không thể thêm banner.");
  return row.id;
}

export async function updateAppMobileBanner(
  id: string,
  values: { sortOrder: number; isActive: boolean },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileBanners)
    .set({
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      updatedAt: now,
    })
    .where(eq(appMobileBanners.id, id));
}

export async function updateAppMobileBannerLink(
  id: string,
  values: { redirectUrl: string | null; routePath: string | null },
): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileBanners)
    .set({
      redirectUrl: values.redirectUrl,
      routePath: values.routePath,
      updatedAt: now,
    })
    .where(eq(appMobileBanners.id, id));
}

export async function deleteAppMobileBannerRow(id: string): Promise<void> {
  await getDb().delete(appMobileBanners).where(eq(appMobileBanners.id, id));
}

export type PublicAppMobileBanner = {
  id: string;
  sortOrder: number;
  imagePath: string;
  imageUrl: string;
};

export type PublicAppMobileItem = {
  id: string;
  kind: "native" | "webview" | "file";
  routeId: string | null;
  webUrl: string | null;
  /** URL công khai khi kind=file (PDF / Word / Excel). */
  fileUrl: string | null;
  label: string;
  iconKey: string;
  iconImagePath: string | null;
  iconImageUrl: string | null;
  accentHex: string;
  isDefaultFavorite: boolean;
  sortOrder: number;
};

export type PublicAppMobileSection = {
  id: string;
  title: string;
  sortOrder: number;
  items: PublicAppMobileItem[];
};

export type PublicAppMobileShellTab = {
  tabKey: string;
  label: string;
  sortOrder: number;
};

export type PublicAppMobileConfig = {
  updatedAt: string;
  theme: {
    primarySeedHex: string;
    homeHeroTitle: string;
  };
  settings: {
    allowCitizenRegister: boolean;
    supportHotline: string | null;
    usageGuide: unknown;
    terms: unknown;
    faqs: Array<{
      id: string;
      question: string;
      answer: string;
      sortOrder: number;
    }>;
  };
  homeBanner: {
    title: string;
    subtitle: string;
    /** URL ảnh hoa văn dưới banner; null → app dùng asset cố định. */
    decorationImageUrl: string | null;
    ctas: Array<{
      key: AppHomeBannerCtaKey;
      label: string;
      sections: Array<{
        id: string;
        label: string;
        icon: string | null;
        children: Array<{
          id: string;
          label: string;
          icon: string | null;
          url?: string | null;
          routePath?: string | null;
        }>;
      }>;
    }>;
  };
  /** Tab thanh điều hướng (chỉ bản ghi đang bật), đã sắp xếp. */
  shellTabs: PublicAppMobileShellTab[];
  banners: PublicAppMobileBanner[];
  midCarousel: {
    insertAfterSectionIndex: number;
    banners: PublicAppMobileBanner[];
  };
  sections: PublicAppMobileSection[];
};

export type PublicHomeCmsSection =
  | {
    type: "slide-section";
    label: string | null;
    items: Array<{
      id: string;
      label: string;
      icon: string | null;
      url?: string | null;
      routePath?: string | null;
      children: Array<{
        id: string;
        label: string;
        icon: string | null;
        url?: string | null;
        routePath?: string | null;
      }>;
    }>;
  }
  | {
    type: "carousel-section";
    label: string | null;
    items: Array<{
      id: string;
      ridirectUrl: string | null;
      routePath: string | null;
      imagePath: string;
      sortOrder: number;
    }>;
  }
  | {
    type: "favorite-section";
    label: string | null;
    items: Array<{
      id: string;
      label: string;
      icon: string | null;
      url: string | null;
      routePath: string | null;
    }>;
  }
  | {
    type: "news-section";
    label: string | null;
    items: Array<{
      id: string;
      thumbnailPath: string;
      description: string;
      createdAt: string;
    }>;
  };

function maxIso(...dates: string[]): string {
  if (dates.length === 0) return new Date().toISOString();
  return dates.reduce((a, b) => (a > b ? a : b));
}

function safeParseEditorJson(raw: string): unknown {
  if (!raw) return { blocks: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? parsed : { blocks: [] };
  } catch {
    return { blocks: [] };
  }
}

/** Payload cho API công khai — chỉ bản ghi đang bật. */
export async function buildPublicAppMobileConfig(): Promise<PublicAppMobileConfig> {
  await ensureAppMobileShellTabsSeeded();
  const themeRow = await getAppMobileThemeRow();
  const homeBannerRow = await ensureAppMobileHomeBannerRow();
  let homeBannerDecorationImageUrl: string | null = null;
  if (homeBannerRow.decorationFileId) {
    const [decoFile] = await getDb()
      .select({ relativePath: files.relativePath })
      .from(files)
      .where(eq(files.id, homeBannerRow.decorationFileId))
      .limit(1);
    if (decoFile?.relativePath) {
      homeBannerDecorationImageUrl = uploadsPublicHref(decoFile.relativePath);
    }
  }
  const settingsRow = await ensureAppMobileSettingsRow();
  const faqsRows = await listAppMobileFaqsPublic();
  const themeDefaults = {
    primarySeedHex: "#0D47A1",
    homeHeroTitle: "Chuyên trang chuyển đổi số\nXã Cửa Việt",
  };

  const shellTabRows = await getDb()
    .select()
    .from(appMobileShellTabs)
    .where(eq(appMobileShellTabs.isActive, true))
    .orderBy(asc(appMobileShellTabs.sortOrder), asc(appMobileShellTabs.tabKey));

  const sectionRows = await getDb()
    .select()
    .from(appMobileHomeSections)
    .where(eq(appMobileHomeSections.isActive, true))
    .orderBy(asc(appMobileHomeSections.sortOrder), asc(appMobileHomeSections.title));

  const itemRows = await getDb()
    .select({
      item: appMobileHomeItems,
      iconFile: files,
    })
    .from(appMobileHomeItems)
    .leftJoin(files, eq(appMobileHomeItems.iconFileId, files.id))
    .where(eq(appMobileHomeItems.isActive, true))
    .orderBy(asc(appMobileHomeItems.sortOrder), asc(appMobileHomeItems.label));

  const documentIds = itemRows
    .map(({ item: it }) => it.documentFileId)
    .filter((id): id is string => Boolean(id));
  const docFileById = new Map<string, FileRow>();
  if (documentIds.length > 0) {
    const uniq = [...new Set(documentIds)];
    const docRows = await getDb()
      .select()
      .from(files)
      .where(inArray(files.id, uniq));
    for (const d of docRows) docFileById.set(d.id, d);
  }

  const bannerTopJoin = await getDb()
    .select({
      banner: appMobileBanners,
      file: files,
    })
    .from(appMobileBanners)
    .innerJoin(files, eq(appMobileBanners.fileId, files.id))
    .where(and(eq(appMobileBanners.isActive, true), eq(appMobileBanners.placement, "top")))
    .orderBy(asc(appMobileBanners.sortOrder), asc(appMobileBanners.createdAt));

  const bannerMidJoin = await getDb()
    .select({
      banner: appMobileBanners,
      file: files,
    })
    .from(appMobileBanners)
    .innerJoin(files, eq(appMobileBanners.fileId, files.id))
    .where(and(eq(appMobileBanners.isActive, true), eq(appMobileBanners.placement, "after_section_2")))
    .orderBy(asc(appMobileBanners.sortOrder), asc(appMobileBanners.createdAt));

  // CTA banner sections/items (separate from main home menu)
  const ctaSectionsRows = await getDb()
    .select({
      section: appMobileHomeBannerSections,
      iconFile: files,
    })
    .from(appMobileHomeBannerSections)
    .leftJoin(files, eq(appMobileHomeBannerSections.iconFileId, files.id))
    .where(eq(appMobileHomeBannerSections.isActive, true))
    .orderBy(asc(appMobileHomeBannerSections.ctaKey), asc(appMobileHomeBannerSections.sortOrder), asc(appMobileHomeBannerSections.title));

  const ctaSectionDocIds = ctaSectionsRows
    .map(({ section: s }) => s.documentFileId)
    .filter((id): id is string => Boolean(id));
  const ctaSectionDocById = new Map<string, FileRow>();
  if (ctaSectionDocIds.length > 0) {
    const uniq = [...new Set(ctaSectionDocIds)];
    const docRows = await getDb()
      .select()
      .from(files)
      .where(inArray(files.id, uniq));
    for (const d of docRows) ctaSectionDocById.set(d.id, d);
  }

  const ctaItemRows = await getDb()
    .select({
      item: appMobileHomeBannerItems,
      iconFile: files,
    })
    .from(appMobileHomeBannerItems)
    .leftJoin(files, eq(appMobileHomeBannerItems.iconFileId, files.id))
    .where(eq(appMobileHomeBannerItems.isActive, true))
    .orderBy(asc(appMobileHomeBannerItems.sortOrder), asc(appMobileHomeBannerItems.label));

  const ctaItemsBySectionId = new Map<string, Array<{ id: string; label: string; icon: string | null; url?: string | null; routePath?: string | null; sortOrder: number }>>();
  for (const { item: it, iconFile } of ctaItemRows) {
    const list = ctaItemsBySectionId.get(it.sectionId) ?? [];
    const iconImagePath = iconFile?.relativePath ? uploadsPublicHref(iconFile.relativePath) : null;
    const iconImageUrl = iconImagePath;
    const link = it.kind === "webview" ? { url: it.webUrl ?? null, routePath: null } : { url: null, routePath: it.routeId ?? null };
    list.push({
      id: it.id,
      label: it.label,
      icon: iconImageUrl,
      url: link.url,
      routePath: link.routePath,
      sortOrder: it.sortOrder,
    });
    ctaItemsBySectionId.set(it.sectionId, list);
  }

  const ctaSectionsByKey = new Map<
    AppHomeBannerCtaKey,
    Array<{
      id: string;
      label: string;
      icon: string | null;
      kind: "native" | "webview" | "file";
      url?: string | null;
      routePath?: string | null;
      fileUrl?: string | null;
      sortOrder: number;
      children: Array<{
        id: string;
        label: string;
        icon: string | null;
        url?: string | null;
        routePath?: string | null;
      }>;
    }>
  >();
  for (const { section: s, iconFile } of ctaSectionsRows) {
    const iconImagePath = iconFile?.relativePath ? uploadsPublicHref(iconFile.relativePath) : null;
    const iconImageUrl = iconImagePath;
    const children = (ctaItemsBySectionId.get(s.id) ?? []).sort((a, b) => {
      const c = a.sortOrder - b.sortOrder;
      return c !== 0 ? c : a.label.localeCompare(b.label, "vi");
    });
    const list = ctaSectionsByKey.get(s.ctaKey as AppHomeBannerCtaKey) ?? [];
    let url: string | null = null;
    let routePath: string | null = null;
    let fileUrl: string | null = null;
    const kind = s.kind;
    if (s.kind === "webview") {
      url = s.webUrl ?? null;
    } else if (s.kind === "file") {
      const doc = s.documentFileId ? ctaSectionDocById.get(s.documentFileId) : undefined;
      fileUrl = doc?.relativePath ? uploadsPublicHref(doc.relativePath) : null;
    } else {
      routePath = s.routeId ?? null;
    }

    list.push({
      id: s.id,
      label: s.title,
      icon: iconImageUrl,
      kind,
      url,
      routePath,
      fileUrl,
      sortOrder: s.sortOrder,
      children: children.map(({ id, label, icon, url, routePath }) => ({ id, label, icon, url, routePath })),
    });
    ctaSectionsByKey.set(s.ctaKey as AppHomeBannerCtaKey, list);
  }

  const itemsBySection = new Map<string, PublicAppMobileItem[]>();
  for (const s of sectionRows) {
    itemsBySection.set(s.id, []);
  }
  for (const { item: it, iconFile } of itemRows) {
    const list = itemsBySection.get(it.sectionId);
    if (!list) continue;
    const iconImagePath = iconFile?.relativePath ? uploadsPublicHref(iconFile.relativePath) : null;
    const iconImageUrl = iconImagePath;
    const docRow = it.documentFileId ? docFileById.get(it.documentFileId) : undefined;
    const fileUrl =
      it.kind === "file" && docRow?.relativePath ? uploadsPublicHref(docRow.relativePath) : null;
    list.push({
      id: it.id,
      kind: it.kind,
      routeId: it.routeId,
      webUrl: it.webUrl,
      fileUrl,
      label: it.label,
      iconKey: it.iconKey,
      iconImagePath,
      iconImageUrl,
      accentHex: it.accentHex,
      isDefaultFavorite: it.isDefaultFavorite,
      sortOrder: it.sortOrder,
    });
  }

  const sections: PublicAppMobileSection[] = sectionRows.map((s) => ({
    id: s.id,
    title: s.title,
    sortOrder: s.sortOrder,
    items: (itemsBySection.get(s.id) ?? []).sort((a, b) => {
      const c = a.sortOrder - b.sortOrder;
      return c !== 0 ? c : a.label.localeCompare(b.label, "vi");
    }),
  }));

  const banners: PublicAppMobileBanner[] = bannerTopJoin.map(({ banner, file }) => {
    const imagePath = uploadsPublicHref(file.relativePath);
    const imageUrl = imagePath;
    return {
      id: banner.id,
      sortOrder: banner.sortOrder,
      imagePath,
      imageUrl,
    };
  });

  const midBanners: PublicAppMobileBanner[] = bannerMidJoin.map(({ banner, file }) => {
    const imagePath = uploadsPublicHref(file.relativePath);
    const imageUrl = imagePath;
    return {
      id: banner.id,
      sortOrder: banner.sortOrder,
      imagePath,
      imageUrl,
    };
  });

  const stamps: string[] = [];
  if (themeRow) stamps.push(themeRow.updatedAt);
  if (homeBannerRow) stamps.push(homeBannerRow.updatedAt);
  if (settingsRow) stamps.push(settingsRow.updatedAt);
  for (const s of sectionRows) stamps.push(s.updatedAt);
  for (const { item: it } of itemRows) stamps.push(it.updatedAt);
  for (const { banner } of bannerTopJoin) stamps.push(banner.updatedAt);
  for (const { banner } of bannerMidJoin) stamps.push(banner.updatedAt);
  for (const { section } of ctaSectionsRows) stamps.push(section.updatedAt);
  for (const { item } of ctaItemRows) stamps.push(item.updatedAt);
  for (const st of shellTabRows) stamps.push(st.updatedAt);
  for (const f of faqsRows) stamps.push(f.updatedAt);

  const shellTabs: PublicAppMobileShellTab[] = shellTabRows.map((st) => ({
    tabKey: st.tabKey,
    label: st.label,
    sortOrder: st.sortOrder,
  }));

  return {
    updatedAt: maxIso(...stamps),
    theme: themeRow
      ? {
        primarySeedHex: themeRow.primarySeedHex,
        homeHeroTitle: themeRow.homeHeroTitle,
      }
      : themeDefaults,
    settings: {
      allowCitizenRegister: settingsRow.allowCitizenRegister,
      supportHotline: settingsRow.supportHotline ?? null,
      usageGuide: safeParseEditorJson(settingsRow.usageGuideJson),
      terms: safeParseEditorJson(settingsRow.termsJson),
      faqs: faqsRows.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        sortOrder: f.sortOrder,
      })),
    },
    homeBanner: {
      title: homeBannerRow.title,
      subtitle: homeBannerRow.subtitle,
      decorationImageUrl: homeBannerDecorationImageUrl,
      ctas: [
        {
          key: "apply_online",
          label: homeBannerRow.applyLabel,
          sections: (ctaSectionsByKey.get("apply_online") ?? []).sort((a, b) => {
            const c = a.sortOrder - b.sortOrder;
            return c !== 0 ? c : a.label.localeCompare(b.label, "vi");
          }),
        },
        {
          key: "lookup_result",
          label: homeBannerRow.lookupLabel,
          sections: (ctaSectionsByKey.get("lookup_result") ?? []).sort((a, b) => {
            const c = a.sortOrder - b.sortOrder;
            return c !== 0 ? c : a.label.localeCompare(b.label, "vi");
          }),
        },
      ],
    },
    shellTabs,
    banners,
    midCarousel: {
      insertAfterSectionIndex: 1,
      banners: midBanners,
    },
    sections,
  };
}

function mapItemLink(it: PublicAppMobileItem): { url: string | null; routePath: string | null } {
  if (it.kind === "webview") return { url: it.webUrl ?? null, routePath: null };
  if (it.kind === "file") return { url: null, routePath: null };
  return { url: null, routePath: it.routeId ?? null };
}

/** Payload giống `dich_vu_phuong/lib/data/json/home-cms.json` (schema-driven trang chủ). */
export async function buildPublicHomeCmsSections(opts?: { favoriteIds?: string[] }): Promise<PublicHomeCmsSection[]> {
  const cfg = await buildPublicAppMobileConfig();
  const favoriteIds = (opts?.favoriteIds ?? []).map((s) => s.trim()).filter(Boolean);

  // 1) slide-section: gom các section -> item, children là menu items.
  const sectionIconRows = await getDb()
    .select({
      sectionId: appMobileHomeSections.id,
      iconRelativePath: files.relativePath,
    })
    .from(appMobileHomeSections)
    .leftJoin(files, eq(appMobileHomeSections.iconFileId, files.id));
  const iconBySectionId = new Map<string, string>();
  for (const r of sectionIconRows) {
    if (!r.iconRelativePath) continue;
    iconBySectionId.set(r.sectionId, uploadsPublicHref(r.iconRelativePath));
  }

  const slideItems = cfg.sections.map((s) => ({
    id: s.id,
    label: s.title,
    icon: iconBySectionId.get(s.id) ?? null,
    children: s.items.map((it) => {
      const link = mapItemLink(it);
      return {
        id: it.id,
        label: it.label,
        icon: it.iconImageUrl ?? null,
        url: link.url,
        routePath: link.routePath,
        kind: it.kind,
        fileUrl: it.fileUrl ?? null,
      };
    }),
  }));

  // 2) carousel-section: dùng banners top, có link (redirectUrl/routePath) nếu cấu hình.
  const bannerTopJoin = await getDb()
    .select({
      banner: appMobileBanners,
      file: files,
    })
    .from(appMobileBanners)
    .innerJoin(files, eq(appMobileBanners.fileId, files.id))
    .where(and(eq(appMobileBanners.isActive, true), eq(appMobileBanners.placement, "top")))
    .orderBy(asc(appMobileBanners.sortOrder), asc(appMobileBanners.createdAt));
  const carouselItems = bannerTopJoin.map(({ banner, file }) => ({
    id: banner.id,
    ridirectUrl: banner.redirectUrl ?? null,
    routePath: banner.routePath ?? null,
    imagePath: uploadsPublicHref(file.relativePath),
    sortOrder: banner.sortOrder,
  }));

  // 3) favorite-section: ưu tiên danh sách client gửi lên; nếu rỗng/không hợp lệ -> default (admin đánh dấu) -> fallback cũ.
  const flat = cfg.sections.flatMap((s) => s.items);
  flat.sort((a, b) => {
    const c = a.sortOrder - b.sortOrder;
    return c !== 0 ? c : a.label.localeCompare(b.label, "vi");
  });
  const favoriteById = new Map(
    flat.map((it) => {
      const link = mapItemLink(it);
      return [
        it.id,
        {
          id: it.id,
          label: it.label,
          icon: it.iconImageUrl ?? null,
          url: link.url,
          routePath: link.routePath,
          kind: it.kind,
          fileUrl: it.fileUrl ?? null,
        },
      ] as const;
    }),
  );

  const picked: Array<{
    id: string;
    label: string;
    icon: string | null;
    url: string | null;
    routePath: string | null;
    kind: PublicAppMobileItem["kind"];
    fileUrl: string | null;
  }> = [];
  const seen = new Set<string>();
  for (const id of favoriteIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const it = favoriteById.get(id);
    if (it) picked.push(it);
    if (picked.length >= 6) break;
  }

  let favoriteItems = picked;
  if (favoriteItems.length === 0) {
    const defaults = flat.filter((it) => Boolean(it.isDefaultFavorite));
    favoriteItems = defaults.slice(0, 6).map((it) => favoriteById.get(it.id)!).filter(Boolean);
  }
  if (favoriteItems.length === 0) {
    favoriteItems = flat.slice(0, 6).map((it) => favoriteById.get(it.id)!).filter(Boolean);
  }

  // 4) news-section: 4 tin mới nhất đang hiển thị.
  const newsRows = await listNewsArticlesVisiblePublicPaged({ limit: 4, offset: 0 });
  const newsItems = newsRows.map((r) => ({
    id: r.id,
    thumbnailPath: uploadsPublicHref(r.bannerRelativePath),
    description: r.title,
    createdAt: r.createdAt,
  }));

  return [
    { type: "slide-section", label: "Nhóm dịch vụ", items: slideItems },
    { type: "carousel-section", label: null, items: carouselItems },
    { type: "favorite-section", label: "Tiện ích yêu thích", items: favoriteItems },
    { type: "news-section", label: "Tin tức", items: newsItems },
  ];
}
