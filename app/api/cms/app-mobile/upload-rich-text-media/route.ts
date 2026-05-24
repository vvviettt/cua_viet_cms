import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { postRichTextEditorImageUpload } from "@/lib/cms/rich-text-image-upload";
import { sessionCanEditModule } from "@/lib/cms-module-access";
import { APP_MOBILE_RICH_TEXT_IMAGE_RELATIVE_PREFIX } from "@/lib/news/save-content-image";

/**
 * Upload ảnh trong CKEditor (cấu hình app mobile) → Supabase Storage.
 * multipart: field `image` (tương thích adapter CKEditor / Editor.js cũ).
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) {
    return NextResponse.json({ success: 0 as const }, { status: 401 });
  }
  return postRichTextEditorImageUpload(request, session, {
    storageRelativePrefix: APP_MOBILE_RICH_TEXT_IMAGE_RELATIVE_PREFIX,
  });
}
