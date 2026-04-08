import { NextResponse } from "next/server";
import { buildPublicAppMobileConfig } from "@/lib/db/app-mobile-config";
import { getPublicRequestOrigin } from "@/lib/http/public-request-origin";

/** Cấu hình trang chủ app (menu, banner, màu) — dùng cho ứng dụng; có thể cache offline. */
export async function GET(request: Request) {
  try {
    const origin = getPublicRequestOrigin(request);
    const payload = await buildPublicAppMobileConfig(origin);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[api/public/app-config]", e);
    return NextResponse.json({ error: "Không tải được cấu hình ứng dụng." }, { status: 500 });
  }
}
