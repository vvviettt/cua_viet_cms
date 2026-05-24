import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { postRichTextEditorImageUpload } from "@/lib/cms/rich-text-image-upload";
import { sessionCanEditModule } from "@/lib/cms-module-access";

/**
 * Upload ảnh trong nội dung tin (Editor.js / CKEditor).
 * - multipart: field `image`
 * - JSON: { "url": "https://..." } (tùy chọn byUrl)
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "news"))) {
    return NextResponse.json({ success: 0 as const }, { status: 401 });
  }
  return postRichTextEditorImageUpload(request, session);
}
