import type { Metadata } from "next";
import { AppMobileCauHinhPageShell } from "@/components/app-mobile/app-mobile-cau-hinh-page-shell";
import { AppMobileNotificationsPanel } from "@/components/app-mobile/app-mobile-notifications-panel";
import { AppMobileShellTabVisibleToggle } from "@/components/app-mobile/app-mobile-shell-tabs-panel";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listAppMobileShellTabsForCms } from "@/lib/db/app-mobile-config";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";
import {
  NOTIFICATION_LIST_PAGE_SIZE,
  listAppMobileNotificationsPaginated,
} from "@/lib/db/app-mobile-notifications";
import { sessionCanEditModule } from "@/lib/cms-module-access";

export const metadata: Metadata = {
  title: `Thông báo — ${SITE.shortTitle}`,
};

export default async function CauHinhAppThongBaoPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const sp = await searchParams;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const requestedPage = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);

  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "app_mobile") : false;
  const [shellTabsRows, notificationPage] = await Promise.all([
    listAppMobileShellTabsForCms(),
    listAppMobileNotificationsPaginated({
      page: requestedPage,
      pageSize: NOTIFICATION_LIST_PAGE_SIZE,
    }),
  ]);
  const totalPages =
    notificationPage.total === 0 ? 0 : Math.ceil(notificationPage.total / notificationPage.pageSize);

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
      description="Quản lý thông báo gửi tới người dùng app và bật/tắt tab Thông báo trên thanh điều hướng dưới."
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
      <AppMobileNotificationsPanel
        canEdit={canEdit}
        items={notificationPage.items.map((n) => ({
          id: n.id,
          category: n.category,
          title: n.title,
          content: n.content,
          sentAt: n.sentAt,
          createdAt: n.createdAt,
        }))}
        pagination={{
          basePath: appMobileCauHinhPaths.thongBao,
          currentPage: notificationPage.page,
          totalPages,
          totalItems: notificationPage.total,
          pageSize: notificationPage.pageSize,
        }}
      />
    </AppMobileCauHinhPageShell>
  );
}
