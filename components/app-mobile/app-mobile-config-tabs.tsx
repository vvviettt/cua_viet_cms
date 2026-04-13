"use client";

import type { ReactNode } from "react";
import { Suspense, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppBannerCreateForm } from "./app-banner-create-form";
import { AppMobileBannerPanel } from "./app-mobile-banner-panel";
import type { AppMobileListBanner, AppMobileListSection } from "./app-mobile-config-types";
import { AppMobileMenuPanel } from "./app-mobile-menu-panel";

type TabId = "theme" | "banner" | "menu";

const TABS: { id: TabId; label: string }[] = [
  { id: "theme", label: "Chủ đề" },
  { id: "banner", label: "Banner" },
  { id: "menu", label: "Danh mục" },
];

function tabFromSearchParams(sp: URLSearchParams): TabId {
  const t = sp.get("tab");
  if (t === "banner" || t === "menu") return t;
  return "theme";
}

function buildPathWithTab(pathname: string, sp: URLSearchParams, tab: TabId): string {
  const q = new URLSearchParams(sp.toString());
  if (tab === "theme") q.delete("tab");
  else q.set("tab", tab);
  const s = q.toString();
  return s ? `${pathname}?${s}` : pathname;
}

type Props = {
  canEdit: boolean;
  themePanel: ReactNode;
  bannersTop: AppMobileListBanner[];
  sections: AppMobileListSection[];
};

function AppMobileConfigTabsInner({ canEdit, themePanel, bannersTop, sections }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = tabFromSearchParams(searchParams);

  const selectTab = useCallback(
    (id: TabId) => {
      router.replace(buildPathWithTab(pathname, searchParams, id), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const scrollToAddBanner = useCallback(() => {
    window.requestAnimationFrame(() => {
      document.getElementById("them-banner")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const goBannerAndScroll = useCallback(() => {
    router.replace(buildPathWithTab(pathname, searchParams, "banner"), { scroll: false });
    setTimeout(scrollToAddBanner, 50);
  }, [pathname, router, scrollToAddBanner, searchParams]);

  return (
    <div className="mt-8">
      <div
        role="tablist"
        aria-label="Cấu hình ứng dụng"
        className="flex flex-wrap gap-2 border-b border-zinc-200 pb-px"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              id={`app-config-tab-${t.id}`}
              aria-controls={`app-config-panel-${t.id}`}
              onClick={() => selectTab(t.id)}
              className={`relative -mb-px rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
                selected
                  ? "border border-b-0 border-zinc-200 bg-white text-(--portal-primary) shadow-[0_1px_0_0_white]"
                  : "border border-transparent text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <div
          role="tabpanel"
          id="app-config-panel-theme"
          aria-labelledby="app-config-tab-theme"
          hidden={tab !== "theme"}
          className={tab === "theme" ? "block" : "hidden"}
        >
          {themePanel}
        </div>

        <div
          role="tabpanel"
          id="app-config-panel-banner"
          aria-labelledby="app-config-tab-banner"
          hidden={tab !== "banner"}
          className={tab === "banner" ? "flex flex-col gap-10" : "hidden"}
        >
          <AppMobileBannerPanel
            canEdit={canEdit}
            banners={bannersTop}
            title="Banner trang chủ"
            description="Sắp xếp bằng mũi tên. Tick để bật/tắt trên app. Nếu chưa có ảnh, app dùng ảnh mặc định."
            placement="top"
            backTab="banner"
            onAddBannerClick={goBannerAndScroll}
          />
          {canEdit ? (
            <div id="them-banner" className="scroll-mt-24">
              <AppBannerCreateForm canEdit={canEdit} placement="top" backTab="banner" />
            </div>
          ) : null}
        </div>

        <div
          role="tabpanel"
          id="app-config-panel-menu"
          aria-labelledby="app-config-tab-menu"
          hidden={tab !== "menu"}
          className={tab === "menu" ? "block" : "hidden"}
        >
          <AppMobileMenuPanel canEdit={canEdit} sections={sections} />
        </div>
      </div>
    </div>
  );
}

export function AppMobileConfigTabs(props: Props) {
  return (
    <Suspense
      fallback={
        <div
          className="mt-8 min-h-48 rounded-xl border border-zinc-200 bg-zinc-50/60 animate-pulse"
          aria-hidden
        />
      }
    >
      <AppMobileConfigTabsInner {...props} />
    </Suspense>
  );
}
