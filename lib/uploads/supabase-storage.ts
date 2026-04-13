import { supabaseAdmin, supabaseBucketName } from "@/lib/supabase/admin";

export function normalizeUploadPath(relativePath: string): string {
  return relativePath.replace(/^\/+/, "").replace(/\\/g, "/");
}

export async function uploadBufferToSupabase(params: {
  relativePath: string;
  buf: Buffer;
  contentType: string;
  cacheControl?: string;
  upsert?: boolean;
}): Promise<{ publicUrl: string; objectPath: string }> {
  const bucket = supabaseBucketName();
  const objectPath = normalizeUploadPath(params.relativePath);
  const supabase = supabaseAdmin();

  const { error } = await supabase.storage.from(bucket).upload(objectPath, params.buf, {
    contentType: params.contentType,
    cacheControl: params.cacheControl ?? "3600",
    upsert: params.upsert ?? false,
  });
  if (error) {
    throw new Error(`supabase_upload_failed:${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = data.publicUrl;
  if (!publicUrl) {
    throw new Error("supabase_public_url_missing");
  }

  return { publicUrl, objectPath };
}

export async function removeSupabaseObject(relativePath: string): Promise<void> {
  const bucket = supabaseBucketName();
  const objectPath = normalizeUploadPath(relativePath);
  const supabase = supabaseAdmin();
  const { error } = await supabase.storage.from(bucket).remove([objectPath]);
  if (error) {
    throw new Error(`supabase_remove_failed:${error.message}`);
  }
}

