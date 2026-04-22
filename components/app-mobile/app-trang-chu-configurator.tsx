"use client";

import { ImageIcon, LayoutGrid, Palette, Rows3 } from "lucide-react";
import { useState } from "react";

import { AppBannerCreateForm } from "@/components/app-mobile/app-banner-create-form";
import { AppMobileBannerPanel } from "@/components/app-mobile/app-mobile-banner-panel";
import type {
  AppMobileListBanner,
  AppMobileListHomeBannerSection,
  AppMobileListSection,
  AppMobileListShellTab,
} from "@/components/app-mobile/app-mobile-config-types";
import { AppMobileMenuPanel } from "@/components/app-mobile/app-mobile-menu-panel";
import { AppMobileShellTabsPanel } from "@/components/app-mobile/app-mobile-shell-tabs-panel";
import { AppHomeBannerConfigForm } from "@/components/app-mobile/app-home-banner-config-form";
import { AppThemeForm } from "@/components/app-mobile/app-theme-form";
import { Modal } from "@/components/ui/modal";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";

type TabId = "appearance" | "catalog" | "media" | "shell";

const TABS: {
  id: TabId;
  label: string;
  hint: string;
  Icon: typeof Palette;
}[] = [
    { id: "appearance", label: "Giao diện", hint: "Màu & tiêu đề hero", Icon: Palette },
    { id: "catalog", label: "Danh mục", hint: "Nhóm & mục dịch vụ", Icon: LayoutGrid },
    { id: "media", label: "Banner", hint: "Ảnh đầu & giữa trang", Icon: ImageIcon },
  ];

type Props = {
  canEdit: boolean;
  defaultPrimaryHex: string;
  defaultHeroTitle: string;
  defaultHomeBannerTitle: string;
  defaultHomeBannerSubtitle: string;
  defaultHomeBannerApplyLabel: string;
  defaultHomeBannerLookupLabel: string;
  homeBannerApplySections: AppMobileListHomeBannerSection[];
  homeBannerLookupSections: AppMobileListHomeBannerSection[];
  sections: AppMobileListSection[];
  bannersTop: AppMobileListBanner[];
  shellTabs: AppMobileListShellTab[];
};

export function AppTrangChuConfigurator({
  canEdit,
  defaultPrimaryHex,
  defaultHeroTitle,
  defaultHomeBannerTitle,
  defaultHomeBannerSubtitle,
  defaultHomeBannerApplyLabel,
  defaultHomeBannerLookupLabel,
  homeBannerApplySections,
  homeBannerLookupSections,
  sections,
  bannersTop,
  shellTabs,
}: Props) {
  const [tab, setTab] = useState<TabId>("appearance");
  const [uploadTopOpen, setUploadTopOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-20 -mx-1 border-b border-zinc-200/90 bg-zinc-50/90 px-1 pb-0 pt-1 backdrop-blur-md supports-backdrop-filter:bg-zinc-50/75">
        <div
          className="flex gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Khu vực cấu hình trang chủ"
        >
          {TABS.map(({ id, label, hint, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex min-w-0 shrink-0 items-center gap-2 rounded-t-xl px-3 py-2.5 text-left text-sm transition sm:px-4 ${active
                  ? "bg-white font-semibold text-zinc-900 shadow-[0_-1px_0_0_var(--portal-primary)] ring-1 ring-zinc-200 ring-b-0"
                  : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
                  }`}
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${active ? "bg-(--portal-primary)/12 text-(--portal-primary)" : "bg-zinc-200/80 text-zinc-600"
                    }`}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate">{label}</span>
                  <span className="mt-0.5 hidden text-[11px] font-normal text-zinc-500 sm:block">{hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {tab === "appearance" ? (
          <div>
            <AppHomeBannerConfigForm
              canEdit={canEdit}
              defaultTitle={defaultHomeBannerTitle}
              defaultSubtitle={defaultHomeBannerSubtitle}
              defaultApplyLabel={defaultHomeBannerApplyLabel}
              defaultLookupLabel={defaultHomeBannerLookupLabel}
              applySections={homeBannerApplySections}
              lookupSections={homeBannerLookupSections}
            />
          </div>
        ) : null}

        {tab === "catalog" ? (

          <AppMobileMenuPanel canEdit={canEdit} sections={sections} embedded />
        ) : null}

        {tab === "media" ? (

          <div className="space-y-4">
            <AppMobileBannerPanel
              canEdit={canEdit}
              banners={bannersTop}
              title="Ảnh tuyên truyền"
              placement="top"
              listHref={appMobileCauHinhPaths.trangChu}
              onAddBannerClick={() => setUploadTopOpen(true)}
              embedded
            />
            <Modal open={uploadTopOpen} onClose={() => setUploadTopOpen(false)} title="Thêm ảnh (phía trên)">
              <AppBannerCreateForm
                canEdit={canEdit}
                placement="top"
                returnTo={appMobileCauHinhPaths.trangChu}
                embedded
              />
            </Modal>
          </div>
        ) : null}


      </div>
    </div>
  );
}
