import { headers } from "next/headers";

/**
 * Cờ `Secure` cho cookie phiên.
 * - `COOKIE_SECURE=true|false` ép bật/tắt (hữu ích sau reverse proxy / HTTP nội bộ).
 * - Nếu có `x-forwarded-proto`, ưu tiên theo header (TLS termination tại proxy).
 * - Mặc định: production → Secure (giữ hành vi cũ khi không có header).
 */
export async function resolveCookieSecure(): Promise<boolean> {
  const explicit = process.env.COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;

  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
    if (proto === "https") return true;
    if (proto === "http") return false;
  } catch {
    /* không có request context */
  }

  return process.env.NODE_ENV === "production";
}
