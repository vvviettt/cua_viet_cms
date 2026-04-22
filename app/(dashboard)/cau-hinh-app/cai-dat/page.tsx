import type { Metadata } from "next";
import { AppMobileCauHinhPageShell } from "@/components/app-mobile/app-mobile-cau-hinh-page-shell";
import { AppMobileShellTabsPanel, AppMobileShellTabVisibleToggle } from "@/components/app-mobile/app-mobile-shell-tabs-panel";
import { AppSettingsPanel } from "@/components/app-mobile/app-settings-panel";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listAppMobileShellTabsForCms } from "@/lib/db/app-mobile-config";
import { getAppMobileSettingsForCms, listAppMobileFaqsForCms } from "@/lib/db/app-mobile-settings";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: `Cài đặt — ${SITE.shortTitle}`,
};

export default async function CauHinhAppCaiDatPage() {
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;
  const [shellTabsRows, settings, faqs] = await Promise.all([
    listAppMobileShellTabsForCms(),
    getAppMobileSettingsForCms(),
    listAppMobileFaqsForCms(),
  ]);

  const listShellTabs = shellTabsRows.map((t) => ({
    id: t.id,
    tabKey: t.tabKey,
    label: t.label,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
  }));
  const profileTab = listShellTabs.find((t) => t.tabKey === "profile") ?? null;

  return (
    <AppMobileCauHinhPageShell
      title="Cài đặt"
      description="Màn hình cài đặt và tài khoản do ứng dụng quản lý. Tại đây bạn chỉnh tab Cài đặt trên thanh điều hướng dưới app."
      titleAfter={
        profileTab ? (
          <AppMobileShellTabVisibleToggle
            canEdit={canEdit}
            tabId={profileTab.id}
            defaultChecked={profileTab.isActive}
          />
        ) : null
      }
    >
      <div className="space-y-6">
        <AppSettingsPanel
          canEdit={canEdit}
          defaultAllowCitizenRegister={settings.allowCitizenRegister}
          defaultSupportHotline={settings.supportHotline ?? null}
          defaultUsageGuideJson={settings.usageGuideJson}
          defaultTermsJson={settings.termsJson}
          faqs={faqs.map((f) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            sortOrder: f.sortOrder,
            isActive: f.isActive,
          }))}
        />

      </div>
    </AppMobileCauHinhPageShell>
  );
}
