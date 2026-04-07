import { NextResponse } from "next/server";
import { listActiveWorkScheduleTypes } from "@/lib/db/work-schedule-types";

/** Danh sách loại lịch đang bật — dùng filter trên ứng dụng. */
export async function GET() {
  try {
    const rows = await listActiveWorkScheduleTypes();
    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        code: r.code,
        label: r.label,
      })),
    });
  } catch (e) {
    console.error("[api/public/work-schedule-types]", e);
    return NextResponse.json({ error: "Không tải được danh sách loại lịch." }, { status: 500 });
  }
}
