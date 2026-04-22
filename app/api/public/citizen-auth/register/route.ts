import { hashSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { mintCitizenToken } from "@/lib/citizen-auth/token";
import { ensureAppMobileSettingsRow } from "@/lib/db/app-mobile-settings";
import {
  findCitizenAccountByPhoneForAuth,
  insertCitizenRegisteredAccount,
  isAnonymousCitizenPasswordHash,
  normalizeCitizenPhone,
  upgradeAnonymousCitizenPassword,
} from "@/lib/db/citizen-accounts";

/** Đăng ký tài khoản công dân (hoặc nâng cấp tài khoản ẩn danh lên có mật khẩu). */
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

    const settings = await ensureAppMobileSettingsRow();
    if (!settings.allowCitizenRegister) {
      return NextResponse.json({ error: "Tạm dừng đăng ký." }, { status: 403 });
    }

    const b = body as Record<string, unknown>;

    const password = String(b.password ?? "");
    const fullName = String(b.fullName ?? "").trim();
    const address = String(b.address ?? "").trim();
    const emailRaw = b.email != null ? String(b.email).trim() : "";
    const phoneNorm = normalizeCitizenPhone(String(b.phone ?? ""));

    if (!phoneNorm) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
    }
    if (password.length < 6 || password.length > 128) {
      return NextResponse.json(
        { error: "Mật khẩu cần từ 6 đến 128 ký tự." },
        { status: 400 },
      );
    }
    if (fullName.length < 2 || fullName.length > 120) {
      return NextResponse.json({ error: "Họ tên không hợp lệ." }, { status: 400 });
    }
    if (address.length < 5 || address.length > 500) {
      return NextResponse.json({ error: "Địa chỉ không hợp lệ." }, { status: 400 });
    }

    const email = emailRaw.length > 0 ? emailRaw : null;
    const passwordHash = hashSync(password, 10);

    const existing = await findCitizenAccountByPhoneForAuth(phoneNorm);
    if (existing) {
      if (!isAnonymousCitizenPasswordHash(existing.passwordHash)) {
        return NextResponse.json(
          { error: "Số điện thoại đã đăng ký. Hãy đăng nhập." },
          { status: 409 },
        );
      }
      await upgradeAnonymousCitizenPassword({
        id: existing.id,
        passwordHash,
        fullName,
        address,
        email,
      });
      const token = mintCitizenToken(existing.id);
      return NextResponse.json({
        token,
        citizen: {
          id: existing.id,
          fullName,
          phone: phoneNorm,
          address,
          email,
        },
      });
    }

    const id = await insertCitizenRegisteredAccount({
      phone: phoneNorm,
      passwordHash,
      fullName,
      address,
      email,
    });
    const token = mintCitizenToken(id);
    return NextResponse.json({
      token,
      citizen: {
        id,
        fullName,
        phone: phoneNorm,
        address,
        email,
      },
    });
  } catch (e) {
    console.error("[api/public/citizen-auth/register]", e);
    return NextResponse.json({ error: "Đăng ký thất bại." }, { status: 500 });
  }
}
