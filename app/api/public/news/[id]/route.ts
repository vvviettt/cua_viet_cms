import { NextResponse } from "next/server";
import { findNewsArticleVisibleById } from "@/lib/db/news-articles";
import { uploadsPublicHref } from "@/lib/uploads/public-url";

type RouteContext = { params: Promise<{ id: string }> };

/** Chi tiết một tin đang hiển thị công khai. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const row = await findNewsArticleVisibleById(id);
    if (!row) {
      return NextResponse.json({ error: "Không tìm thấy tin hoặc tin đã ẩn." }, { status: 404 });
    }
    let content: unknown = null;
    try {
      content = JSON.parse(row.contentJson) as unknown;
    } catch {
      content = { blocks: [] };
    }
    return NextResponse.json({
      id: row.id,
      title: row.title,
      category: { id: row.categoryId, title: row.categoryTitle },
      bannerUrl: uploadsPublicHref(row.bannerRelativePath),
      content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdBy: {
        name: row.authorFullName?.trim() || null,
        email: row.authorEmail,
      },
      isVisible: row.isVisible,
    });
  } catch (e) {
    console.error("[api/public/news/[id]]", e);
    return NextResponse.json({ error: "Không tải được tin." }, { status: 500 });
  }
}
