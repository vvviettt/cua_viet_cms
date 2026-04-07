import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";
import { parseSessionPayload } from "@/lib/session-cookie";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dang-nhap")) {
    return NextResponse.next();
  }

  /** API & file tĩnh phục vụ ứng dụng công dân (không dùng cookie CMS). */
  if (pathname.startsWith("/api/public") || pathname.startsWith("/uploads/")) {
    return NextResponse.next();
  }

  /** Cron nội bộ: xác thực bằng CRON_SECRET trong route, không dùng cookie CMS. */
  if (pathname.startsWith("/api/cron/")) {
    return NextResponse.next();
  }

  const session = parseSessionPayload(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dang-nhap";
    if (pathname !== "/") {
      url.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
