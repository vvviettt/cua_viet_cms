import { NextResponse } from "next/server";
import { buildPublicHomeCmsSections } from "@/lib/db/app-mobile-config";
import { getPublicRequestOrigin } from "@/lib/http/public-request-origin";

function parseFavoriteIds(request: Request): string[] {
  try {
    const url = new URL(request.url);
    // Support both `favoriteIds=a,b,c` and repeated `favoriteId=...`.
    const ids: string[] = [];
    const csv = url.searchParams.get("favoriteIds");
    if (csv) {
      for (const part of csv.split(",")) {
        const t = part.trim();
        if (t) ids.push(t);
      }
    }
    for (const v of url.searchParams.getAll("favoriteId")) {
      const t = v.trim();
      if (t) ids.push(t);
    }
    return ids;
  } catch {
    return [];
  }
}

/**
 * Schema-driven home sections for mobile app.
 * Shape matches `dich_vu_phuong/lib/data/json/home-cms.json`.
 */
export async function GET(request: Request) {
  try {
    void getPublicRequestOrigin(request);
    const favoriteIds = parseFavoriteIds(request);
    const payload = await buildPublicHomeCmsSections({ favoriteIds });
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/public/home-cms]", e);
    return NextResponse.json({ error: "Không tải được cấu hình trang chủ." }, { status: 500 });
  }
}

