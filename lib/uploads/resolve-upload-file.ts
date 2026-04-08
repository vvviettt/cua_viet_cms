import path from "node:path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

/** MIME cho file trong uploads (ảnh CMS, PDF lịch làm việc, …). */
export function uploadsContentType(absPath: string): string {
  const ext = path.extname(absPath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".pdf":
      return "application/pdf";
    default:
      return "application/octet-stream";
  }
}

/**
 * Ghép segment URL thành đường dẫn tuyệt đối trong `public/uploads`.
 * Trả `null` nếu path traversal hoặc không nằm trong thư mục uploads.
 */
export function resolveUploadsAbsolutePath(urlPathSegments: string[]): string | null {
  if (!urlPathSegments?.length) return null;
  let decoded: string[];
  try {
    decoded = urlPathSegments.map((s) => decodeURIComponent(s));
  } catch {
    return null;
  }
  if (decoded.some((s) => s === "" || s === "." || s === "..")) return null;

  const resolved = path.resolve(UPLOADS_ROOT, ...decoded);
  const rootWithSep = UPLOADS_ROOT.endsWith(path.sep) ? UPLOADS_ROOT : `${UPLOADS_ROOT}${path.sep}`;
  if (resolved !== UPLOADS_ROOT && !resolved.startsWith(rootWithSep)) return null;

  return resolved;
}
