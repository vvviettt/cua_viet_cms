import { NextResponse } from "next/server";
import {
  type NewsArticleListRow,
  listNewsArticlesVisiblePublic,
  listNewsArticlesVisiblePublicPaged,
} from "@/lib/db/news-articles";
import { uploadsPublicHref } from "@/lib/uploads/public-url";

function mapRow(r: NewsArticleListRow, includeParsedContent: boolean) {
  let content: unknown = { blocks: [] };
  if (includeParsedContent) {
    try {
      content = JSON.parse(r.contentJson) as unknown;
    } catch {
      content = { blocks: [] };
    }
  }
  return {
    id: r.id,
    title: r.title,
    category: { id: r.categoryId, title: r.categoryTitle },
    bannerUrl: uploadsPublicHref(r.bannerRelativePath),
    content,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    createdBy: {
      name: r.authorFullName?.trim() || null,
      email: r.authorEmail,
    },
    isVisible: r.isVisible,
  };
}

/** Danh sách tin đang bật hiển thị — dùng cho ứng dụng / cổng. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get("limit");

    if (limitRaw === null) {
      const rows = await listNewsArticlesVisiblePublic();
      return NextResponse.json({
        items: rows.map((r) => mapRow(r, true)),
      });
    }

    const pageSize = Math.min(50, Math.max(1, parseInt(limitRaw, 10) || 15));
    const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
    const fetchSize = pageSize + 1;
    const batch = await listNewsArticlesVisiblePublicPaged({
      limit: fetchSize,
      offset,
    });
    const hasMore = batch.length > pageSize;
    const slice = hasMore ? batch.slice(0, pageSize) : batch;

    return NextResponse.json({
      items: slice.map((r) => mapRow(r, false)),
      hasMore,
      nextOffset: offset + slice.length,
    });
  } catch (e) {
    console.error("[api/public/news]", e);
    return NextResponse.json({ error: "Không tải được danh sách tin tức." }, { status: 500 });
  }
}
