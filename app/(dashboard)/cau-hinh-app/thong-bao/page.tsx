import type { Metadata } from "next";
import { AppMobileCauHinhPageShell } from "@/components/app-mobile/app-mobile-cau-hinh-page-shell";
import { AppMobileShellTabsPanel, AppMobileShellTabVisibleToggle } from "@/components/app-mobile/app-mobile-shell-tabs-panel";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listAppMobileShellTabsForCms } from "@/lib/db/app-mobile-config";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: `Thông báo — ${SITE.shortTitle}`,
};

export default async function CauHinhAppThongBaoPage() {
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;
  const shellTabsRows = await listAppMobileShellTabsForCms();

  const listShellTabs = shellTabsRows.map((t) => ({
    id: t.id,
    tabKey: t.tabKey,
    label: t.label,
    sortOrder: t.sortOrder,
    isActive: t.isActive,
  }));
  const notificationsTab = listShellTabs.find((t) => t.tabKey === "notifications") ?? null;

  return (
    <AppMobileCauHinhPageShell
      title="Thông báo"
      description="Danh sách thông báo do ứng dụng và máy chủ quản lý. Tại đây bạn chỉnh tab Thông báo trên thanh điều hướng dưới app."
      titleAfter={
        notificationsTab ? (
          <AppMobileShellTabVisibleToggle
            canEdit={canEdit}
            tabId={notificationsTab.id}
            defaultChecked={notificationsTab.isActive}
          />
        ) : null
      }
    >
      <></>
    </AppMobileCauHinhPageShell>
  );
}
