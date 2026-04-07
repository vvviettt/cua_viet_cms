import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const s = process.env.CITIZEN_JWT_SECRET?.trim();
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "development") {
    return "dev-citizen-jwt-secret-min-16-chars!";
  }
  throw new Error("Thiếu biến môi trường CITIZEN_JWT_SECRET (tối thiểu 16 ký tự).");
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

/** Token dạng `payloadBase64url.signatureBase64url` (HMAC-SHA256). */
export function mintCitizenToken(citizenId: string): string {
  const exp = Date.now() + TTL_MS;
  const payload = b64url(Buffer.from(JSON.stringify({ sub: citizenId, exp }), "utf8"));
  const sig = b64url(createHmac("sha256", getSecret()).update(payload).digest());
  return `${payload}.${sig}`;
}

/** Trả về `citizenId` hoặc `null` nếu sai / hết hạn. */
export function verifyCitizenToken(token: string): string | null {
  const trimmed = token.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadPart = trimmed.slice(0, dot);
  const sigPart = trimmed.slice(dot + 1);
  if (!payloadPart || !sigPart) return null;

  const expectedSig = createHmac("sha256", getSecret()).update(payloadPart).digest();
  let sigBuf: Buffer;
  try {
    sigBuf = Buffer.from(sigPart, "base64url");
  } catch {
    return null;
  }
  if (sigBuf.length !== expectedSig.length || !timingSafeEqual(sigBuf, expectedSig)) {
    return null;
  }

  let json: { sub?: unknown; exp?: unknown };
  try {
    json = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as {
      sub?: unknown;
      exp?: unknown;
    };
  } catch {
    return null;
  }
  if (typeof json.exp !== "number" || json.exp < Date.now()) return null;
  if (typeof json.sub !== "string" || !json.sub) return null;
  return json.sub;
}
