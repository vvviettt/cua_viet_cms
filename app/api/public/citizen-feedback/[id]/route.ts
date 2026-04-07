import { NextResponse } from "next/server";
import { findPublicCitizenFeedbackById } from "@/lib/db/citizen-feedback";

type RouteContext = { params: Promise<{ id: string }> };

/** Chi tiết một phản ánh công khai (không ẩn khỏi app). */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const row = await findPublicCitizenFeedbackById(id);
    if (!row) {
      return NextResponse.json({ error: "Không tìm thấy hoặc đã ẩn." }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch (e) {
    console.error("[api/public/citizen-feedback/[id]]", e);
    return NextResponse.json({ error: "Không tải được chi tiết." }, { status: 500 });
  }
}
