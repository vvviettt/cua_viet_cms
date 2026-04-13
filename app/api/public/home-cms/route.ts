import { NextResponse } from "next/server";
import { buildPublicHomeCmsSections } from "@/lib/db/app-mobile-config";
import { getPublicRequestOrigin } from "@/lib/http/public-request-origin";

/**
 * Schema-driven home sections for mobile app.
 * Shape matches `dich_vu_phuong/lib/data/json/home-cms.json`.
 */
export async function GET(request: Request) {
  try {
    void getPublicRequestOrigin(request);
    const payload = await buildPublicHomeCmsSections();
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/public/home-cms]", e);
    return NextResponse.json({ error: "Không tải được cấu hình trang chủ." }, { status: 500 });
  }
}

