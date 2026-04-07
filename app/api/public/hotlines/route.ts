import { NextResponse } from "next/server";
import { listPublicHotlinesActive } from "@/lib/db/public-hotlines";

/** Danh sách đường dây nóng đang bật — dùng cho ứng dụng. */
export async function GET() {
  try {
    const rows = await listPublicHotlinesActive();
    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        serviceName: r.serviceName,
        phone: r.phone,
        note: r.note,
        sortOrder: r.sortOrder,
      })),
    });
  } catch (e) {
    console.error("[api/public/hotlines]", e);
    return NextResponse.json({ error: "Không tải được danh sách đường dây nóng." }, { status: 500 });
  }
}

