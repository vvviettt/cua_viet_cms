import { hashSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { mintCitizenToken } from "@/lib/citizen-auth/token";
import { ensureAppMobileSettingsRow } from "@/lib/db/app-mobile-settings";
import {
  findCitizenAccountByCccdForAuth,
  findCitizenAccountByPhoneForAuth,
  insertCitizenRegisteredAccount,
  isAnonymousCitizenPasswordHash,
  normalizeCitizenCccd,
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
    const cccdNorm = normalizeCitizenCccd(String(b.cccd ?? ""));

    if (!phoneNorm) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
    }
    if (!cccdNorm) {
      return NextResponse.json(
        { error: "Số CCCD không hợp lệ (12 chữ số)." },
        { status: 400 },
      );
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
    if (address.length > 500) {
      return NextResponse.json({ error: "Địa chỉ quá dài." }, { status: 400 });
    }

    const email = emailRaw.length > 0 ? emailRaw : null;
    const passwordHash = hashSync(password, 10);

    const existingByCccd = await findCitizenAccountByCccdForAuth(cccdNorm);
    if (
      existingByCccd &&
      !isAnonymousCitizenPasswordHash(existingByCccd.passwordHash)
    ) {
      return NextResponse.json(
        { error: "Số CCCD đã được đăng ký. Hãy đăng nhập." },
        { status: 409 },
      );
    }

    const existingByPhone = await findCitizenAccountByPhoneForAuth(phoneNorm);
    if (existingByPhone) {
      if (!isAnonymousCitizenPasswordHash(existingByPhone.passwordHash)) {
        return NextResponse.json(
          { error: "Số điện thoại đã đăng ký. Hãy đăng nhập." },
          { status: 409 },
        );
      }
      if (existingByCccd && existingByCccd.id !== existingByPhone.id) {
        return NextResponse.json(
          { error: "Số CCCD đã được đăng ký trên tài khoản khác." },
          { status: 409 },
        );
      }
      await upgradeAnonymousCitizenPassword({
        id: existingByPhone.id,
        passwordHash,
        fullName,
        cccd: cccdNorm,
        address,
        email,
      });
      const token = mintCitizenToken(existingByPhone.id);
      return NextResponse.json({
        token,
        citizen: {
          id: existingByPhone.id,
          fullName,
          phone: phoneNorm,
          cccd: cccdNorm,
          address,
          email,
        },
      });
    }

    if (existingByCccd) {
      return NextResponse.json(
        { error: "Số CCCD đã được đăng ký trên tài khoản khác." },
        { status: 409 },
      );
    }

    const id = await insertCitizenRegisteredAccount({
      phone: phoneNorm,
      passwordHash,
      fullName,
      cccd: cccdNorm,
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
        cccd: cccdNorm,
        address,
        email,
      },
    });
  } catch (e) {
    console.error("[api/public/citizen-auth/register]", e);
    return NextResponse.json({ error: "Đăng ký thất bại." }, { status: 500 });
  }
}
