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
import { listNewsArticlesVisiblePublicPaged } from "@/lib/db/news-articles";

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
    .insert(appMobileHomeItems)
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
  kind: "native" | "webview";
  routeId: string | null;
  webUrl: string | null;
  label: string;
  iconKey: string;
  iconImagePath: string | null;
  iconImageUrl: string | null;
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

/** Payload cho API công khai — chỉ bản ghi đang bật. */
export async function buildPublicAppMobileConfig(): Promise<PublicAppMobileConfig> {
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
    .select({
      item: appMobileHomeItems,
      iconFile: files,
    })
    .from(appMobileHomeItems)
    .leftJoin(files, eq(appMobileHomeItems.iconFileId, files.id))
    .where(eq(appMobileHomeItems.isActive, true))
    .orderBy(asc(appMobileHomeItems.sortOrder), asc(appMobileHomeItems.label));

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

  const itemsBySection = new Map<string, PublicAppMobileItem[]>();
  for (const s of sectionRows) {
    itemsBySection.set(s.id, []);
  }
  for (const { item: it, iconFile } of itemRows) {
    const list = itemsBySection.get(it.sectionId);
    if (!list) continue;
    const iconImagePath = iconFile?.relativePath ? uploadsPublicHref(iconFile.relativePath) : null;
    const iconImageUrl = iconImagePath;
    list.push({
      id: it.id,
      kind: it.kind,
      routeId: it.routeId,
      webUrl: it.webUrl,
      label: it.label,
      iconKey: it.iconKey,
      iconImagePath,
      iconImageUrl,
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
  for (const s of sectionRows) stamps.push(s.updatedAt);
  for (const { item: it } of itemRows) stamps.push(it.updatedAt);
  for (const { banner } of bannerTopJoin) stamps.push(banner.updatedAt);
  for (const { banner } of bannerMidJoin) stamps.push(banner.updatedAt);

  return {
    updatedAt: maxIso(...stamps),
    theme: themeRow
      ? {
          primarySeedHex: themeRow.primarySeedHex,
          homeHeroTitle: themeRow.homeHeroTitle,
        }
      : themeDefaults,
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
  return { url: null, routePath: it.routeId ?? null };
}

/** Payload giống `dich_vu_phuong/lib/data/json/home-cms.json` (schema-driven trang chủ). */
export async function buildPublicHomeCmsSections(): Promise<PublicHomeCmsSection[]> {
  const cfg = await buildPublicAppMobileConfig();

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

  // 3) favorite-section: lấy 6 item đầu theo sortOrder tổng thể.
  const flat = cfg.sections.flatMap((s) => s.items);
  flat.sort((a, b) => {
    const c = a.sortOrder - b.sortOrder;
    return c !== 0 ? c : a.label.localeCompare(b.label, "vi");
  });
  const favoriteItems = flat.slice(0, 6).map((it) => {
    const link = mapItemLink(it);
    return {
      id: it.id,
      label: it.label,
      icon: it.iconImageUrl ?? null,
      url: link.url,
      routePath: link.routePath,
    };
  });

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
