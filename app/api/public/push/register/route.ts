import { NextResponse } from "next/server";
import { verifyCitizenToken } from "@/lib/citizen-auth/token";
import {
  deleteAppPushDeviceToken,
  upsertAppPushDeviceToken,
  type AppPushPlatform,
} from "@/lib/db/app-push-device-tokens";
import { logNotification } from "@/lib/log/notification-log";

function citizenIdFromRequest(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) return null;
  return verifyCitizenToken(h.slice(7).trim());
}

function parsePlatform(raw: string): AppPushPlatform | null {
  const v = raw.trim().toLowerCase();
  if (v === "android" || v === "ios") return v;
  return null;
}

/** Đăng ký / cập nhật token FCM từ app. */
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
    const token = String(b.token ?? "").trim();
    const platform = parsePlatform(String(b.platform ?? ""));
    const deviceIdRaw = String(b.deviceId ?? "").trim();
    const deviceId = deviceIdRaw.length > 0 ? deviceIdRaw.slice(0, 120) : null;

    if (!token || token.length < 20) {
      return NextResponse.json({ error: "Token FCM không hợp lệ." }, { status: 400 });
    }
    if (!platform) {
      return NextResponse.json({ error: "platform phải là android hoặc ios." }, { status: 400 });
    }

    const citizenAccountId = citizenIdFromRequest(request);

    await upsertAppPushDeviceToken({
      fcmToken: token,
      platform,
      citizenAccountId,
      deviceId,
    });

    logNotification("push:token-registered", {
      platform,
      hasCitizen: Boolean(citizenAccountId),
      tokenPrefix: `${token.slice(0, 12)}…`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/public/push/register]", e);
    return NextResponse.json({ error: "Không thể đăng ký token." }, { status: 500 });
  }
}

/** Hủy đăng ký token (đăng xuất / gỡ app). */
export async function DELETE(request: Request) {
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
    const token = String((body as Record<string, unknown>).token ?? "").trim();
    if (!token) {
      return NextResponse.json({ error: "Thiếu token." }, { status: 400 });
    }
    await deleteAppPushDeviceToken(token);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/public/push/register DELETE]", e);
    return NextResponse.json({ error: "Không thể hủy token." }, { status: 500 });
  }
}
