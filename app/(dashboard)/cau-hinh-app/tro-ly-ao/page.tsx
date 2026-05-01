import type { Metadata } from "next";
import { AppMobileCauHinhPageShell } from "@/components/app-mobile/app-mobile-cau-hinh-page-shell";
import { AppMobileShellTabsPanel, AppMobileShellTabVisibleToggle } from "@/components/app-mobile/app-mobile-shell-tabs-panel";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listAppMobileShellTabsForCms } from "@/lib/db/app-mobile-config";
import { sessionCanEditModule } from "@/lib/cms-module-access";

export const metadata: Metadata = {
  title: `Trợ lý ảo — ${SITE.shortTitle}`,
};

export default async function CauHinhAppTroLyAoPage() {
  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "app_mobile") : false;
  const shellTabsRows = await listAppMobileShellTabsForCms();

  const listShellTabs = shellTabsRows.map((t) => ({
    id: t.id,
    tabKey: t.tabKey,
    label: t.label,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
  }));
  const assistantTab = listShellTabs.find((t) => t.tabKey === "assistant") ?? null;

  return (
    <AppMobileCauHinhPageShell
      title="Trợ lý ảo"
      description="Nội dung hội thoại trợ lý do ứng dụng xử lý. Tại đây bạn chỉnh tab Trợ lý ảo trên thanh điều hướng dưới app (hiển thị và thứ tự)."
      titleAfter={
        assistantTab ? (
          <AppMobileShellTabVisibleToggle
            canEdit={canEdit}
            tabId={assistantTab.id}
            defaultChecked={assistantTab.isActive}
          />
        ) : null
      }
    >
      <></>
    </AppMobileCauHinhPageShell>
  );
}
