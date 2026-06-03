import { NextResponse } from "next/server";
import { bearerCitizenId } from "@/lib/citizen-auth/request";
import {
  findCitizenAccountByIdForAuth,
  findCitizenAccountByPhoneForAuth,
  normalizeCitizenPhone,
  updateCitizenProfileById,
} from "@/lib/db/citizen-accounts";

function citizenJson(row: {
  id: string;
  fullName: string;
  phone: string;
  cccd: string | null;
  address: string;
  email: string | null;
}) {
  return {
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    cccd: row.cccd,
    address: row.address,
    email: row.email,
  };
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
    return NextResponse.json({ citizen: citizenJson(row) });
  } catch (e) {
    console.error("[api/public/citizen-auth/me]", e);
    return NextResponse.json({ error: "Không tải được thông tin." }, { status: 500 });
  }
}

/** Cập nhật thông tin công dân (không đổi CCCD, mật khẩu). */
export async function PATCH(request: Request) {
  try {
    const id = bearerCitizenId(request);
    if (!id) {
      return NextResponse.json({ error: "Chưa đăng nhập hoặc token không hợp lệ." }, { status: 401 });
    }
    const current = await findCitizenAccountByIdForAuth(id);
    if (!current) {
      return NextResponse.json({ error: "Tài khoản không tồn tại." }, { status: 404 });
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
    const fullName = String(b.fullName ?? "").trim();
    const address = String(b.address ?? "").trim();
    const emailRaw = b.email != null ? String(b.email).trim() : "";
    const phoneNorm = normalizeCitizenPhone(String(b.phone ?? ""));

    if (!phoneNorm) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
    }
    if (fullName.length < 2 || fullName.length > 120) {
      return NextResponse.json({ error: "Họ tên không hợp lệ." }, { status: 400 });
    }
    if (address.length > 500) {
      return NextResponse.json({ error: "Địa chỉ quá dài." }, { status: 400 });
    }

    const email = emailRaw.length > 0 ? emailRaw : null;

    const phoneOwner = await findCitizenAccountByPhoneForAuth(phoneNorm);
    if (phoneOwner && phoneOwner.id !== id) {
      return NextResponse.json(
        { error: "Số điện thoại đã được sử dụng." },
        { status: 409 },
      );
    }

    const updated = await updateCitizenProfileById(id, {
      fullName,
      phone: phoneNorm,
      address,
      email,
    });

    return NextResponse.json({ citizen: citizenJson(updated) });
  } catch (e) {
    console.error("[api/public/citizen-auth/me PATCH]", e);
    return NextResponse.json({ error: "Cập nhật thất bại." }, { status: 500 });
  }
}
