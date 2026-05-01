function utf8ToBase64Url(utf8: string): string {
  const bytes = new TextEncoder().encode(utf8);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToUtf8(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export type SessionPayload = {
  userId: string;
  email: string;
  isAdmin: boolean;
  name?: string;
};

function parseJsonSession(text: string): SessionPayload | null {
  try {
    const o = JSON.parse(text) as Record<string, unknown>;
    if (typeof o.userId !== "string" || typeof o.email !== "string") {
      return null;
    }
    let isAdmin = false;
    if (typeof o.isAdmin === "boolean") {
      isAdmin = o.isAdmin;
    } else if (typeof o.role === "string") {
      isAdmin = o.role === "admin";
    } else {
      return null;
    }
    const name = typeof o.name === "string" ? o.name : undefined;
    return { userId: o.userId, email: o.email, isAdmin, name };
  } catch {
    return null;
  }
}

/** Ghi cookie: tránh ký tự `"`, `;`, xuống dòng trong JSON làm vỡ header Set-Cookie ở một số proxy. */
export function serializeSessionPayload(p: SessionPayload): string {
  const body = JSON.stringify({
    userId: p.userId,
    email: p.email,
    isAdmin: p.isAdmin,
    ...(p.name != null ? { name: p.name } : {}),
  });
  return utf8ToBase64Url(body);
}

export function parseSessionPayload(raw: string | undefined): SessionPayload | null {
  if (!raw) return null;

  if (raw.startsWith("{")) {
    return parseJsonSession(raw);
  }

  try {
    const text = base64UrlToUtf8(raw);
    return parseJsonSession(text);
  } catch {
    return null;
  }
}
