import { compareSync } from "bcryptjs";
import { NextResponse } from "next/server";
import { bearerCitizenId } from "@/lib/citizen-auth/request";
import {
  findCitizenAccountByIdForPasswordAuth,
  isAnonymousCitizenPasswordHash,
} from "@/lib/db/citizen-accounts";

/** Xác minh mật khẩu hiện tại (bước 1 đổi mật khẩu). */
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
      return NextResponse.json({ error: "Nhập mật khẩu hiện tại." }, { status: 400 });
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
    if (!compareSync(password, row.passwordHash)) {
      return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 401 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/public/citizen-auth/verify-password]", e);
    return NextResponse.json({ error: "Xác minh thất bại." }, { status: 500 });
  }
}
