import { compareSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { mintCitizenToken } from "@/lib/citizen-auth/token";
import {
  findCitizenAccountByCccdForAuth,
  isAnonymousCitizenPasswordHash,
  normalizeCitizenCccd,
} from "@/lib/db/citizen-accounts";

export async function POST(request: Request) {
  try {
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
    const cccdNorm = normalizeCitizenCccd(String(b.cccd ?? ""));
    const password = String(b.password ?? "");

    if (!cccdNorm) {
      return NextResponse.json(
        { error: "Số CCCD không hợp lệ (12 chữ số)." },
        { status: 400 },
      );
    }
    if (!password) {
      return NextResponse.json({ error: "Nhập mật khẩu." }, { status: 400 });
    }

    const row = await findCitizenAccountByCccdForAuth(cccdNorm);
    if (!row) {
      return NextResponse.json(
        { error: "Số CCCD hoặc mật khẩu không đúng." },
        { status: 401 },
      );
    }
    if (isAnonymousCitizenPasswordHash(row.passwordHash)) {
      return NextResponse.json(
        { error: "Tài khoản chưa đặt mật khẩu. Hãy đăng ký." },
        { status: 401 },
      );
    }
    if (!compareSync(password, row.passwordHash)) {
      return NextResponse.json(
        { error: "Số CCCD hoặc mật khẩu không đúng." },
        { status: 401 },
      );
    }

    const token = mintCitizenToken(row.id);
    return NextResponse.json({
      token,
      citizen: {
        id: row.id,
        fullName: row.fullName,
        phone: row.phone,
        cccd: row.cccd,
        address: row.address,
        email: row.email,
      },
    });
  } catch (e) {
    console.error("[api/public/citizen-auth/login]", e);
    return NextResponse.json({ error: "Đăng nhập thất bại." }, { status: 500 });
  }
}
