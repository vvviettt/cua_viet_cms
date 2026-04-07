import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  assertFetchablePublicImageUrl,
  extFromMimeType,
  extFromUploadName,
  MAX_CONTENT_IMAGE_BYTES,
  persistContentImageBuffer,
} from "@/lib/news/save-content-image";
import { canEditContent } from "@/lib/roles";

/** Định dạng trả về cho @editorjs/image */
function okBody(url: string) {
  return { success: 1 as const, file: { url } };
}

function fail(status: number) {
  return NextResponse.json({ success: 0 as const }, { status });
}

/**
 * Upload ảnh trong nội dung tin (Editor.js Image tool).
 * - multipart: field `image` (mặc định của Editor.js)
 * - JSON: { "url": "https://..." } (tùy chọn byUrl)
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) {
    return fail(401);
  }

  const ct = request.headers.get("content-type") ?? "";

  if (ct.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return fail(400);
    }
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return fail(400);
    }
    if (file.size > MAX_CONTENT_IMAGE_BYTES) {
      return fail(413);
    }
    const nameLower = file.name.toLowerCase();
    const parsed = extFromUploadName(nameLower, file.type);
    if (!parsed) {
      return fail(400);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    try {
      const { url } = await persistContentImageBuffer({
        session,
        buf,
        parsed,
        originalName: file.name || `image.${parsed.ext}`,
      });
      return NextResponse.json(okBody(url));
    } catch {
      return fail(500);
    }
  }

  if (ct.includes("application/json")) {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return fail(400);
    }
    const urlStr =
      typeof body === "object" && body !== null && "url" in body
        ? String((body as { url: unknown }).url).trim()
        : "";
    if (!urlStr) {
      return fail(400);
    }
    const safeUrl = assertFetchablePublicImageUrl(urlStr);
    if (!safeUrl) {
      return fail(400);
    }

    let res: Response;
    try {
      res = await fetch(safeUrl, {
        redirect: "follow",
        headers: { "User-Agent": "CmsNewsContentImage/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      return fail(502);
    }
    if (!res.ok) {
      return fail(502);
    }
    const mimeHeader = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const parsed = extFromMimeType(mimeHeader);
    if (!parsed) {
      return fail(400);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_CONTENT_IMAGE_BYTES) {
      return fail(413);
    }
    try {
      const { url } = await persistContentImageBuffer({
        session,
        buf,
        parsed,
        originalName: safeUrl.pathname.split("/").pop() || `remote.${parsed.ext}`,
      });
      return NextResponse.json(okBody(url));
    } catch {
      return fail(500);
    }
  }

  return fail(415);
}
