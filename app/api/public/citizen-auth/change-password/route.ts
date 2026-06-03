import { compareSync, hashSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { bearerCitizenId } from "@/lib/citizen-auth/request";
import {
  findCitizenAccountByIdForPasswordAuth,
  isAnonymousCitizenPasswordHash,
  updateCitizenPasswordById,
} from "@/lib/db/citizen-accounts";

/** Đổi mật khẩu (bước 2 — mật khẩu mới phải khác mật khẩu cũ). */
export async function POST(request: Request) {
  try {
    const id = bearerCitizenId(request);
    if (!id) {
      return NextResponse.json({ error: "Chưa đăng nhập hoặc token không hợp lệ." }, { status: 401 });
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
    const currentPassword = String(b.currentPassword ?? "");
    const newPassword = String(b.newPassword ?? "");

    if (!currentPassword) {
      return NextResponse.json({ error: "Nhập mật khẩu hiện tại." }, { status: 400 });
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      return NextResponse.json(
        { error: "Mật khẩu mới cần từ 6 đến 128 ký tự." },
        { status: 400 },
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Mật khẩu mới phải khác mật khẩu hiện tại." },
        { status: 400 },
      );
    }

    const row = await findCitizenAccountByIdForPasswordAuth(id);
    if (!row) {
      return NextResponse.json({ error: "Tài khoản không tồn tại." }, { status: 404 });
    }
    if (isAnonymousCitizenPasswordHash(row.passwordHash)) {
      return NextResponse.json(
        { error: "Tài khoản chưa đặt mật khẩu." },
        { status: 400 },
      );
    }
    if (!compareSync(currentPassword, row.passwordHash)) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 401 });
    }

    const passwordHash = hashSync(newPassword, 10);
    await updateCitizenPasswordById(id, passwordHash);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/public/citizen-auth/change-password]", e);
    return NextResponse.json({ error: "Đổi mật khẩu thất bại." }, { status: 500 });
  }
}
