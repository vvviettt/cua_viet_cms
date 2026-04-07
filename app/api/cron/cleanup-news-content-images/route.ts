import { NextResponse } from "next/server";
import { cleanupOrphanNewsContentImages } from "@/lib/news/cleanup-orphan-content-images";

/**
 * Cron: dọn ảnh nội dung tin không dùng, chỉ file tạo trước ≥24h.
 *
 * Bảo vệ: `CRON_SECRET` trong env. Gửi header
 * `Authorization: Bearer <CRON_SECRET>` (Vercel Cron tự gửi khi đặt biến này),
 * hoặc query `?secret=<CRON_SECRET>` (máy chủ / curl).
 *
 * Lịch 2h sáng giờ Việt Nam ≈ `0 19 * * *` UTC (xem `vercel.json`).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Chưa cấu hình CRON_SECRET trên server." },
      { status: 501 },
    );
  }

  const auth = request.headers.get("authorization");
  const okBearer = auth === `Bearer ${secret}`;
  const url = new URL(request.url);
  const okQuery = url.searchParams.get("secret") === secret;
  if (!okBearer && !okQuery) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await cleanupOrphanNewsContentImages();
    return NextResponse.json({
      ok: true,
      deletedCount: result.deletedCount,
      cutoffIso: result.cutoffIso,
      errorCount: result.errors.length,
      errors: result.errors.length ? result.errors : undefined,
    });
  } catch (e) {
    console.error("[cron cleanup-news-content-images]", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
