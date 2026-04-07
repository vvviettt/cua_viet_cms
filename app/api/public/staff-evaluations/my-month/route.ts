import { NextResponse } from "next/server";
import { verifyCitizenToken } from "@/lib/citizen-auth/token";
import { findCitizenAccountByIdForAuth } from "@/lib/db/citizen-accounts";
import { listMyRatedStaffIdsThisMonth } from "@/lib/db/staff-member-ratings";

function bearerCitizenId(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return verifyCitizenToken(h.slice(7).trim());
}

/** Danh sách staffId đã đánh giá trong tháng này (yêu cầu đăng nhập). */
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

    const staffIds = await listMyRatedStaffIdsThisMonth({ citizenAccountId: citizenId });
    return NextResponse.json({ staffIds });
  } catch (e) {
    console.error("[api/public/staff-evaluations/my-month]", e);
    return NextResponse.json({ error: "Không tải được dữ liệu." }, { status: 500 });
  }
}

