import { NextResponse } from "next/server";
import { verifyCitizenToken } from "@/lib/citizen-auth/token";
import {
  findCitizenAccountByIdForAuth,
  normalizeCitizenPhone,
  upsertCitizenAccountFromPublicForm,
} from "@/lib/db/citizen-accounts";
import {
  insertCitizenFeedback,
  listPublicCitizenFeedbackByPhone,
  listPublicCitizenFeedbackFeedPaginated,
  PUBLIC_CITIZEN_FEEDBACK_PAGE_SIZE,
} from "@/lib/db/citizen-feedback";
import type { CitizenFeedbackKind } from "@/lib/citizen-feedback/types";

const KINDS: CitizenFeedbackKind[] = ["phan_anh", "kien_nghi"];

function isKind(v: unknown): v is CitizenFeedbackKind {
  return typeof v === "string" && (KINDS as string[]).includes(v);
}

function bearerCitizenId(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return verifyCitizenToken(h.slice(7).trim());
}

/**
 * GET không `phone`: luồng công khai — mọi phản ánh không ẩn, mới nhất trước.
 * GET có `phone`: phản ánh của một SĐT (tra cứu cá nhân).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const phoneRaw = url.searchParams.get("phone");
    const limit = Math.min(
      50,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? String(PUBLIC_CITIZEN_FEEDBACK_PAGE_SIZE), 10) || PUBLIC_CITIZEN_FEEDBACK_PAGE_SIZE),
    );
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

    if (!phoneRaw?.trim()) {
      const { items, hasMore, nextOffset } = await listPublicCitizenFeedbackFeedPaginated({
        limit,
        offset,
      });
      return NextResponse.json({ items, hasMore, nextOffset });
    }

    const phone = normalizeCitizenPhone(phoneRaw);
    if (!phone) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
    }

    const { items, hasMore, nextOffset } = await listPublicCitizenFeedbackByPhone({
      phone,
      limit,
      offset,
    });
    return NextResponse.json({ items, hasMore, nextOffset });
  } catch (e) {
    console.error("[api/public/citizen-feedback GET]", e);
    return NextResponse.json({ error: "Không tải được danh sách." }, { status: 500 });
  }
}

/** Gửi phản ánh / kiến nghị — có Bearer token thì chỉ cần kind, title, content. */
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

    if (!isKind(b.kind)) {
      return NextResponse.json(
        { error: "Loại phải là phan_anh hoặc kien_nghi." },
        { status: 400 },
      );
    }
    const kind = b.kind;

    const title = String(b.title ?? "").trim();
    const content = String(b.content ?? "").trim();

    if (title.length < 5 || title.length > 200) {
      return NextResponse.json(
        { error: "Tiêu đề cần từ 5 đến 200 ký tự." },
        { status: 400 },
      );
    }
    if (content.length < 20 || content.length > 8000) {
      return NextResponse.json(
        { error: "Nội dung cần từ 20 đến 8000 ký tự." },
        { status: 400 },
      );
    }

    const tokenCitizenId = bearerCitizenId(request);
    if (tokenCitizenId) {
      const acc = await findCitizenAccountByIdForAuth(tokenCitizenId);
      if (!acc) {
        return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
      }
      const id = await insertCitizenFeedback({
        kind,
        title,
        content,
        citizenAccountId: tokenCitizenId,
      });
      return NextResponse.json({ ok: true, id });
    }

    const fullName = String(b.fullName ?? "").trim();
    const address = String(b.address ?? "").trim();
    const phoneRaw = String(b.phone ?? "").trim();
    const emailRaw = b.email != null ? String(b.email).trim() : "";

    if (fullName.length < 2 || fullName.length > 120) {
      return NextResponse.json({ error: "Họ tên không hợp lệ." }, { status: 400 });
    }
    if (address.length < 5 || address.length > 500) {
      return NextResponse.json({ error: "Địa chỉ cần từ 5 đến 500 ký tự." }, { status: 400 });
    }

    const phone = normalizeCitizenPhone(phoneRaw);
    if (!phone) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ." }, { status: 400 });
    }

    const citizenAccountId = await upsertCitizenAccountFromPublicForm({
      phone,
      fullName,
      address,
      email: emailRaw.length > 0 ? emailRaw : null,
    });

    const id = await insertCitizenFeedback({
      kind,
      title,
      content,
      citizenAccountId,
    });

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[api/public/citizen-feedback POST]", e);
    return NextResponse.json({ error: "Không gửi được. Thử lại sau." }, { status: 500 });
  }
}
