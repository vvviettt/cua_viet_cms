import { normalizeUploadPath } from "@/lib/uploads/supabase-storage";

/**
 * URL công khai cho file upload.
 *
 * Hiện tại dùng Supabase Storage public URL (bucket mặc định: `uploads`).
 */
export function uploadsPublicHref(relativePath: string): string {
  const objectPath = normalizeUploadPath(relativePath);
  // Must work in both server + client components.
  const supabaseUrl =
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const bucket = (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    process.env.SUPABASE_STORAGE_BUCKET ||
    "uploads"
  )
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  if (!supabaseUrl) {
    // Avoid crashing client components; return a relative URL-like placeholder.
    return "";
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
}
