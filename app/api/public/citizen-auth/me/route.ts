import { NextResponse } from "next/server";
import { verifyCitizenToken } from "@/lib/citizen-auth/token";
import { findCitizenAccountByIdForAuth } from "@/lib/db/citizen-accounts";

function bearerCitizenId(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return verifyCitizenToken(h.slice(7).trim());
}

export async function GET(request: Request) {
  try {
    const id = bearerCitizenId(request);
    if (!id) {
      return NextResponse.json({ error: "Chưa đăng nhập hoặc token không hợp lệ." }, { status: 401 });
    }
    const row = await findCitizenAccountByIdForAuth(id);
    if (!row) {
      return NextResponse.json({ error: "Tài khoản không tồn tại." }, { status: 404 });
    }
    return NextResponse.json({
      citizen: {
        id: row.id,
        fullName: row.fullName,
        phone: row.phone,
        address: row.address,
        email: row.email,
      },
    });
  } catch (e) {
    console.error("[api/public/citizen-auth/me]", e);
    return NextResponse.json({ error: "Không tải được thông tin." }, { status: 500 });
  }
}
