import type { Metadata } from "next";
import { AppMobileCauHinhPageShell } from "@/components/app-mobile/app-mobile-cau-hinh-page-shell";
import { AppTrangChuConfigurator } from "@/components/app-mobile/app-trang-chu-configurator";
import { AppMobileShellTabVisibleToggle } from "@/components/app-mobile/app-mobile-shell-tabs-panel";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import {
  ensureAppMobileHomeBannerRow,
  ensureAppMobileThemeRow,
  listAppMobileBannersForCms,
  listAppMobileHomeBannerItemsForCms,
  listAppMobileHomeBannerSectionsForCms,
  listAppMobileItemsForCms,
  listAppMobileSectionsForCms,
  listAppMobileShellTabsForCms,
} from "@/lib/db/app-mobile-config";
import { uploadsPublicHref } from "@/lib/uploads/public-url";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: `Trang chủ app — ${SITE.shortTitle}`,
};

function toBannerList(rows: Awaited<ReturnType<typeof listAppMobileBannersForCms>>) {
  return rows.map(({ banner, file }) => ({
    id: banner.id,
    sortOrder: banner.sortOrder,
    isActive: banner.isActive,
    previewSrc: uploadsPublicHref(file.relativePath),
    fileName: file.originalName,
  }));
}

export default async function CauHinhAppTrangChuPage() {
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;
  const [theme, homeBanner, ctaApplySections, ctaLookupSections, ctaItems, bannersTop, sections, items, shellTabsRows] =
    await Promise.all([
      ensureAppMobileThemeRow(),
      ensureAppMobileHomeBannerRow(),
      listAppMobileHomeBannerSectionsForCms("apply_online"),
      listAppMobileHomeBannerSectionsForCms("lookup_result"),
      listAppMobileHomeBannerItemsForCms(),
      listAppMobileBannersForCms("top"),
      listAppMobileSectionsForCms(),
      listAppMobileItemsForCms(),
      listAppMobileShellTabsForCms(),
    ]);
  const listBannersTop = toBannerList(bannersTop);

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
      isDefaultFavorite: it.isDefaultFavorite,
    })),
  }));

  const listShellTabs = shellTabsRows.map((t) => ({
    id: t.id,
    tabKey: t.tabKey,
    label: t.label,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
  }));
  const homeTab = listShellTabs.find((t) => t.tabKey === "home") ?? null;

  const ctaItemsBySection = new Map<string, typeof ctaItems>();
  for (const s of [...ctaApplySections, ...ctaLookupSections]) {
    ctaItemsBySection.set(s.id, []);
  }
  for (const it of ctaItems) {
    const list = ctaItemsBySection.get(it.sectionId);
    if (list) list.push(it);
  }
  for (const list of ctaItemsBySection.values()) {
    list.sort((a, b) => {
      const c = a.sortOrder - b.sortOrder;
      return c !== 0 ? c : a.label.localeCompare(b.label, "vi");
    });
  }

  const toCtaSectionList = (ctaKey: "apply_online" | "lookup_result", secs: typeof ctaApplySections) =>
    secs.map((sec) => ({
      id: sec.id,
      ctaKey,
      title: sec.title,
      kind: sec.kind,
      routeId: sec.routeId,
      webUrl: sec.webUrl,
      sortOrder: sec.sortOrder,
      isActive: sec.isActive,
      items: (ctaItemsBySection.get(sec.id) ?? []).map((it) => ({
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

  const listCtaApplySections = toCtaSectionList("apply_online", ctaApplySections);
  const listCtaLookupSections = toCtaSectionList("lookup_result", ctaLookupSections);

  return (
    <AppMobileCauHinhPageShell
      wide
      title="Trang chủ app"
      titleAfter={
        homeTab ? (
          <AppMobileShellTabVisibleToggle
            canEdit={canEdit}
            tabId={homeTab.id}
            defaultChecked={homeTab.isActive}
          />
        ) : null
      }
    >
      <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/40 p-3 sm:p-5">
        <AppTrangChuConfigurator
          canEdit={canEdit}
          defaultPrimaryHex={theme.primarySeedHex}
          defaultHeroTitle={theme.homeHeroTitle}
          defaultHomeBannerTitle={homeBanner.title}
          defaultHomeBannerSubtitle={homeBanner.subtitle}
          defaultHomeBannerApplyLabel={homeBanner.applyLabel}
          defaultHomeBannerLookupLabel={homeBanner.lookupLabel}
          homeBannerApplySections={listCtaApplySections}
          homeBannerLookupSections={listCtaLookupSections}
          sections={listSections}
          bannersTop={listBannersTop}
          shellTabs={listShellTabs}
        />
      </div>
    </AppMobileCauHinhPageShell>
  );
}
