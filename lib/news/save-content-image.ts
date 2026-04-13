import { randomUUID } from "crypto";
import { insertUploadedFile } from "@/lib/db/file-records";
import type { SessionPayload } from "@/lib/session-cookie";
import { uploadBufferToSupabase } from "@/lib/uploads/supabase-storage";

/** Dùng chung với job dọn ảnh nội dung tin. */
export const NEWS_CONTENT_IMAGE_RELATIVE_PREFIX = "tin-tuc/noi-dung";
export const MAX_CONTENT_IMAGE_BYTES = 8 * 1024 * 1024;

export function extFromUploadName(nameLower: string, fileMime: string): { ext: string; mime: string } | null {
  const mime = (fileMime || "").toLowerCase();
  if (nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg")) {
    if (mime && !["image/jpeg", "image/jpg", "application/octet-stream"].includes(mime)) return null;
    return { ext: "jpg", mime: mime || "image/jpeg" };
  }
  if (nameLower.endsWith(".png")) {
    if (mime && !["image/png", "application/octet-stream"].includes(mime)) return null;
    return { ext: "png", mime: mime || "image/png" };
  }
  if (nameLower.endsWith(".webp")) {
    if (mime && !["image/webp", "application/octet-stream"].includes(mime)) return null;
    return { ext: "webp", mime: mime || "image/webp" };
  }
  if (nameLower.endsWith(".gif")) {
    if (mime && !["image/gif", "application/octet-stream"].includes(mime)) return null;
    return { ext: "gif", mime: mime || "image/gif" };
  }
  return null;
}

export function extFromMimeType(mimeRaw: string): { ext: string; mime: string } | null {
  const mime = mimeRaw.split(";")[0]?.trim().toLowerCase() ?? "";
  if (mime === "image/jpeg" || mime === "image/jpg") return { ext: "jpg", mime: "image/jpeg" };
  if (mime === "image/png") return { ext: "png", mime: "image/png" };
  if (mime === "image/webp") return { ext: "webp", mime: "image/webp" };
  if (mime === "image/gif") return { ext: "gif", mime: "image/gif" };
  return null;
}

function isBlockedImageUrlHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return true;
  if (h === "0.0.0.0" || h === "[::1]" || h === "::1") return true;
  if (/^127\./.test(h)) return true;
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (/^169\.254\./.test(h)) return true;
  return false;
}

export function assertFetchablePublicImageUrl(urlString: string): URL | null {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  if (isBlockedImageUrlHost(u.hostname)) return null;
  return u;
}

export async function persistContentImageBuffer(params: {
  session: SessionPayload;
  buf: Buffer;
  parsed: { ext: string; mime: string };
  originalName: string;
}): Promise<{ url: string }> {
  if (params.buf.length < 10) {
    throw new Error("invalid_image");
  }
  const fileName = `nd-${randomUUID()}.${params.parsed.ext}`;
  const relativePath = `${NEWS_CONTENT_IMAGE_RELATIVE_PREFIX}/${fileName}`;
  const { publicUrl } = await uploadBufferToSupabase({
    relativePath,
    buf: params.buf,
    contentType: params.parsed.mime,
    cacheControl: "3600",
    upsert: false,
  });

  try {
    await insertUploadedFile({
      category: "other",
      relativePath,
      originalName: params.originalName.slice(0, 240),
      mimeType: params.parsed.mime,
      sizeBytes: params.buf.length,
      uploadedById: params.session.userId,
    });
  } catch (e) {
    throw e;
  }

  return { url: publicUrl };
}
