import type { Metadata } from "next";
import Link from "next/link";
import { AppMobileConfigTabs } from "@/components/app-mobile/app-mobile-config-tabs";
import { AppThemeForm } from "@/components/app-mobile/app-theme-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import {
  ensureAppMobileThemeRow,
  listAppMobileBannersForCms,
  listAppMobileItemsForCms,
  listAppMobileSectionsForCms,
} from "@/lib/db/app-mobile-config";
import { uploadsPublicHref } from "@/lib/uploads/public-url";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Cấu hình ứng dụng di động",
  description: "Menu trang chủ, banner và màu app — " + SITE.shortTitle,
};

export default async function CauHinhAppPage() {
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;

  const theme = await ensureAppMobileThemeRow();
  const sections = await listAppMobileSectionsForCms();
  const items = await listAppMobileItemsForCms();
  const bannersTop = await listAppMobileBannersForCms("top");
  const bannersMid = await listAppMobileBannersForCms("after_section_2");

  const itemsBySection = new Map<string, typeof items>();
  for (const s of sections) {
    itemsBySection.set(s.id, []);
  }
  for (const it of items) {
    const list = itemsBySection.get(it.sectionId);
    if (list) list.push(it);
  }
  for (const list of itemsBySection.values()) {
    list.sort((a, b) => {
      const c = a.sortOrder - b.sortOrder;
      return c !== 0 ? c : a.label.localeCompare(b.label, "vi");
    });
  }

  const listBannersTop = bannersTop.map(({ banner, file }) => ({
    id: banner.id,
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
    previewSrc: uploadsPublicHref(file.relativePath),
    fileName: file.originalName,
  }));

  const listBannersMid = bannersMid.map(({ banner, file }) => ({
    id: banner.id,
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
    previewSrc: uploadsPublicHref(file.relativePath),
    fileName: file.originalName,
  }));

  const listSections = sections.map((sec) => ({
    id: sec.id,
    title: sec.title,
    sortOrder: sec.sortOrder,
    isActive: sec.isActive,
    items: (itemsBySection.get(sec.id) ?? []).map((it) => ({
      id: it.id,
      sectionId: it.sectionId,
      label: it.label,
      kind: it.kind,
      routeId: it.routeId,
      webUrl: it.webUrl,
      sortOrder: it.sortOrder,
      isActive: it.isActive,
    })),
  }));

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link href="/" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
          ← Bảng điều khiển
        </Link>
      </div>

      <header className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Cấu hình ứng dụng di động</h1>
        
      </header>

      <AppMobileConfigTabs
        canEdit={canEdit}
        bannersTop={listBannersTop}
        bannersMid={listBannersMid}
        sections={listSections}
        themePanel={
          <AppThemeForm
            canEdit={canEdit}
            defaultPrimaryHex={theme.primarySeedHex}
            defaultHeroTitle={theme.homeHeroTitle}
          />
        }
      />
    </div>
  );
}
