import { supabaseAdmin, supabaseBucketName } from "@/lib/supabase/admin";
import { normalizeUploadPath } from "@/lib/uploads/supabase-storage";

/**
 * URL công khai cho file upload.
 *
 * Hiện tại dùng Supabase Storage public URL (bucket mặc định: `uploads`).
 */
export function uploadsPublicHref(relativePath: string): string {
  const bucket = supabaseBucketName();
  const objectPath = normalizeUploadPath(relativePath);
  const supabase = supabaseAdmin();
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}
