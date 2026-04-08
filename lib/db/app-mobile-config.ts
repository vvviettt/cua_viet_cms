import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  appMobileBanners,
  appMobileHomeItems,
  appMobileHomeSections,
  appMobileTheme,
  files,
} from "@/lib/db/schema";
import { uploadsPublicHref } from "@/lib/uploads/public-url";

export type AppMobileThemeRow = typeof appMobileTheme.$inferSelect;
export type AppMobileSectionRow = typeof appMobileHomeSections.$inferSelect;
export type AppMobileItemRow = typeof appMobileHomeItems.$inferSelect;

export type AppMobileBannerCmsRow = {
  banner: typeof appMobileBanners.$inferSelect;
  file: typeof files.$inferSelect;
};

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

export async function nextAppMobileBannerSortOrder(): Promise<number> {
  const rows = await listAppMobileBannersForCms();
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

export async function moveAppMobileBannerRelative(bannerId: string, direction: "up" | "down"): Promise<void> {
  const rows = await listAppMobileBannersForCms();
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
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileHomeSections)
    .values({
      title: values.title,
      sortOrder: values.sortOrder,
      isActive: values.isActive,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: appMobileHomeSections.id });
  if (!row) throw new Error("Không thể thêm nhóm menu.");
  return row.id;
}

export async function updateAppMobileSectionTitle(id: string, title: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb()
    .update(appMobileHomeSections)
    .set({
      title,
      updatedAt: now,
    })
    .where(eq(appMobileHomeSections.id, id));
}

export async function deleteAppMobileSection(id: string): Promise<void> {
  await getDb().delete(appMobileHomeSections).where(eq(appMobileHomeSections.id, id));
}

export async function insertAppMobileItem(values: {
  sectionId: string;
  kind: "native" | "webview";
  routeId: string | null;
  webUrl: string | null;
  label: string;
  iconKey: string;
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
      label: values.label,
      iconKey: values.iconKey,
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
    kind: "native" | "webview";
    routeId: string | null;
    webUrl: string | null;
    label: string;
    iconKey: string;
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
      label: values.label,
      iconKey: values.iconKey,
      accentHex: values.accentHex,
      updatedAt: now,
    })
    .where(eq(appMobileHomeItems.id, id));
}

export async function deleteAppMobileItem(id: string): Promise<void> {
  await getDb().delete(appMobileHomeItems).where(eq(appMobileHomeItems.id, id));
}

export async function listAppMobileBannersForCms(): Promise<AppMobileBannerCmsRow[]> {
  const rows = await getDb()
    .select({
      banner: appMobileBanners,
      file: files,
    })
    .from(appMobileBanners)
    .innerJoin(files, eq(appMobileBanners.fileId, files.id))
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
  sortOrder: number;
  isActive: boolean;
}): Promise<string> {
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(appMobileBanners)
    .values({
      fileId: values.fileId,
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
  kind: "native" | "webview";
  routeId: string | null;
  webUrl: string | null;
  label: string;
  iconKey: string;
  accentHex: string;
  sortOrder: number;
};

export type PublicAppMobileSection = {
  id: string;
  title: string;
  sortOrder: number;
  items: PublicAppMobileItem[];
};

export type PublicAppMobileConfig = {
  updatedAt: string;
  theme: {
    primarySeedHex: string;
    homeHeroTitle: string;
  };
  banners: PublicAppMobileBanner[];
  sections: PublicAppMobileSection[];
};

function maxIso(...dates: string[]): string {
  if (dates.length === 0) return new Date().toISOString();
  return dates.reduce((a, b) => (a > b ? a : b));
}

/** Payload cho API công khai — chỉ bản ghi đang bật. */
export async function buildPublicAppMobileConfig(requestOrigin: string): Promise<PublicAppMobileConfig> {
  const themeRow = await getAppMobileThemeRow();
  const themeDefaults = {
    primarySeedHex: "#0D47A1",
    homeHeroTitle: "Chuyên trang chuyển đổi số\nXã Cửa Việt",
  };

  const sectionRows = await getDb()
    .select()
    .from(appMobileHomeSections)
    .where(eq(appMobileHomeSections.isActive, true))
    .orderBy(asc(appMobileHomeSections.sortOrder), asc(appMobileHomeSections.title));

  const itemRows = await getDb()
    .select()
    .from(appMobileHomeItems)
    .where(eq(appMobileHomeItems.isActive, true))
    .orderBy(asc(appMobileHomeItems.sortOrder), asc(appMobileHomeItems.label));

  const bannerJoin = await getDb()
    .select({
      banner: appMobileBanners,
      file: files,
    })
    .from(appMobileBanners)
    .innerJoin(files, eq(appMobileBanners.fileId, files.id))
    .where(eq(appMobileBanners.isActive, true))
    .orderBy(asc(appMobileBanners.sortOrder), asc(appMobileBanners.createdAt));

  const itemsBySection = new Map<string, PublicAppMobileItem[]>();
  for (const s of sectionRows) {
    itemsBySection.set(s.id, []);
  }
  for (const it of itemRows) {
    const list = itemsBySection.get(it.sectionId);
    if (!list) continue;
    list.push({
      id: it.id,
      kind: it.kind,
      routeId: it.routeId,
      webUrl: it.webUrl,
      label: it.label,
      iconKey: it.iconKey,
      accentHex: it.accentHex,
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

  const banners: PublicAppMobileBanner[] = bannerJoin.map(({ banner, file }) => {
    const imagePath = uploadsPublicHref(file.relativePath);
    const imageUrl = `${requestOrigin.replace(/\/$/, "")}${imagePath}`;
    return {
      id: banner.id,
      sortOrder: banner.sortOrder,
      imagePath,
      imageUrl,
    };
  });

  const stamps: string[] = [];
  if (themeRow) stamps.push(themeRow.updatedAt);
  for (const s of sectionRows) stamps.push(s.updatedAt);
  for (const it of itemRows) stamps.push(it.updatedAt);
  for (const { banner } of bannerJoin) stamps.push(banner.updatedAt);

  return {
    updatedAt: maxIso(...stamps),
    theme: themeRow
      ? {
          primarySeedHex: themeRow.primarySeedHex,
          homeHeroTitle: themeRow.homeHeroTitle,
        }
      : themeDefaults,
    banners,
    sections,
  };
}
