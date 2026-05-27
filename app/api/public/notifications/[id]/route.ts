import { NextResponse } from "next/server";
import { findAppMobileNotificationPublicById } from "@/lib/db/app-mobile-notifications";

type RouteContext = { params: Promise<{ id: string }> };

/** Chi tiết một thông báo đã gửi. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const row = await findAppMobileNotificationPublicById(id);
    if (!row) {
      return NextResponse.json(
        { error: "Không tìm thấy thông báo hoặc thông báo chưa được gửi." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
      sentAt: row.sentAt,
      createdAt: row.createdAt,
    });
  } catch (e) {
    console.error("[api/public/notifications/[id]]", e);
    return NextResponse.json({ error: "Không tải được thông báo." }, { status: 500 });
  }
}
