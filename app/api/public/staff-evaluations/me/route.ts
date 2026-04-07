import { NextResponse } from "next/server";
import { verifyCitizenToken } from "@/lib/citizen-auth/token";
import { findCitizenAccountByIdForAuth } from "@/lib/db/citizen-accounts";
import { findMyStaffRatingThisMonth } from "@/lib/db/staff-member-ratings";

function bearerCitizenId(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return verifyCitizenToken(h.slice(7).trim());
}

/** Kiểm tra user đã đánh giá cán bộ này trong tháng chưa. */
export async function GET(request: Request) {
  try {
    const citizenId = bearerCitizenId(request);
    if (!citizenId) {
      return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
    }
    const acc = await findCitizenAccountByIdForAuth(citizenId);
    if (!acc) {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
    }

    const url = new URL(request.url);
    const staffId = String(url.searchParams.get("staffId") ?? "").trim();
    if (!staffId) {
      return NextResponse.json({ error: "Thiếu staffId." }, { status: 400 });
    }

    const existing = await findMyStaffRatingThisMonth({
      citizenAccountId: citizenId,
      staffMemberId: staffId,
    });
    return NextResponse.json({ ratedThisMonth: !!existing });
  } catch (e) {
    console.error("[api/public/staff-evaluations/me]", e);
    return NextResponse.json({ error: "Không kiểm tra được trạng thái đánh giá." }, { status: 500 });
  }
}

