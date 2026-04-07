import { NextResponse } from "next/server";
import { verifyCitizenToken } from "@/lib/citizen-auth/token";
import { findCitizenAccountByIdForAuth } from "@/lib/db/citizen-accounts";
import { findStaffMemberById } from "@/lib/db/staff-members";
import { createStaffMemberRatingOncePerMonth } from "@/lib/db/staff-member-ratings";

function bearerCitizenId(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return verifyCitizenToken(h.slice(7).trim());
}

function isPgUniqueViolation(e: unknown): boolean {
  // pg error code 23505
  return typeof e === "object" && e !== null && (e as { code?: unknown }).code === "23505";
}

/** Tạo đánh giá cán bộ (yêu cầu đăng nhập). */
export async function POST(request: Request) {
  try {
    const citizenId = bearerCitizenId(request);
    if (!citizenId) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để đánh giá." }, { status: 401 });
    }
    const acc = await findCitizenAccountByIdForAuth(citizenId);
    if (!acc) {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Dữ liệu không phải JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Thân yêu cầu không hợp lệ." }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const staffId = String(b.staffId ?? "").trim();
    if (!staffId) {
      return NextResponse.json({ error: "Thiếu staffId." }, { status: 400 });
    }
    const staff = await findStaffMemberById(staffId);
    if (!staff || !staff.isActive) {
      return NextResponse.json({ error: "Cán bộ không tồn tại hoặc không còn công tác." }, { status: 404 });
    }

    const stars = Number(b.stars ?? 0);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json({ error: "Số sao phải từ 1 đến 5." }, { status: 400 });
    }

    const detailRaw = String(b.detail ?? "").trim();
    const detail = detailRaw.length > 0 ? detailRaw : null;
    if (detail != null && detail.length > 300) {
      return NextResponse.json({ error: "Chi tiết tối đa 300 ký tự." }, { status: 400 });
    }

    try {
      const id = await createStaffMemberRatingOncePerMonth({
        citizenAccountId: citizenId,
        staffMemberId: staffId,
        stars,
        detail,
      });
      return NextResponse.json({ ok: true, id });
    } catch (e) {
      if (isPgUniqueViolation(e)) {
        return NextResponse.json(
          { error: "Bạn chỉ được đánh giá 1 lần/tháng cho mỗi cán bộ." },
          { status: 429 },
        );
      }
      throw e;
    }
  } catch (e) {
    console.error("[api/public/staff-evaluations POST]", e);
    return NextResponse.json({ error: "Không gửi được đánh giá." }, { status: 500 });
  }
}

