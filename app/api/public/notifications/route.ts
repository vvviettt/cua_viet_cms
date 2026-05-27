import { NextResponse } from "next/server";
import { listAppMobileNotificationsPublicPaged } from "@/lib/db/app-mobile-notifications";
import type { AppMobileNotificationRow } from "@/lib/db/app-mobile-notifications";
import { logNotification } from "@/lib/log/notification-log";

function mapRow(row: AppMobileNotificationRow) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.content,
    sentAt: row.sentAt,
    createdAt: row.createdAt,
  };
}

/** Danh sách thông báo đã gửi — dùng cho app (limit + offset). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "15", 10) || 15));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
    const fetchSize = pageSize + 1;

    const batch = await listAppMobileNotificationsPublicPaged({
      limit: fetchSize,
      offset,
    });
    const hasMore = batch.length > pageSize;
    const slice = hasMore ? batch.slice(0, pageSize) : batch;

    logNotification("api:public-list", {
      offset,
      limit: pageSize,
      returned: slice.length,
      hasMore,
      ids: slice.map((r) => r.id),
    });

    return NextResponse.json({
      items: slice.map(mapRow),
      hasMore,
      nextOffset: offset + slice.length,
    });
  } catch (e) {
    console.error("[api/public/notifications]", e);
    return NextResponse.json({ error: "Không tải được danh sách thông báo." }, { status: 500 });
  }
}
