import { compareSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { bearerCitizenId } from "@/lib/citizen-auth/request";
import {
  deleteCitizenAccountById,
  findCitizenAccountByIdForPasswordAuth,
  isAnonymousCitizenPasswordHash,
} from "@/lib/db/citizen-accounts";

/** Người dân tự xóa tài khoản — yêu cầu mật khẩu hiện tại. */
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

    const password = String((body as Record<string, unknown>).password ?? "");
    if (!password) {
      return NextResponse.json({ error: "Nhập mật khẩu để xác nhận." }, { status: 400 });
    }

    const row = await findCitizenAccountByIdForPasswordAuth(id);
    if (!row) {
      return NextResponse.json({ error: "Tài khoản không tồn tại." }, { status: 404 });
    }
    if (isAnonymousCitizenPasswordHash(row.passwordHash)) {
      return NextResponse.json(
        { error: "Tài khoản chưa đặt mật khẩu, không thể xóa qua app." },
        { status: 400 },
      );
    }
    if (!compareSync(password, row.passwordHash)) {
      return NextResponse.json({ error: "Mật khẩu không đúng." }, { status: 401 });
    }

    await deleteCitizenAccountById(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/public/citizen-auth/delete-account]", e);
    return NextResponse.json({ error: "Xóa tài khoản thất bại." }, { status: 500 });
  }
}
