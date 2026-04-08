import { readFile } from "node:fs/promises";

import { resolveUploadsAbsolutePath, uploadsContentType } from "@/lib/uploads/resolve-upload-file";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ path: string[] }> };

/**
 * Phục vụ file upload từ `public/uploads` đọc trực tiếp từ disk mỗi request.
 * Tránh giới hạn production của Next (file thêm sau `next build` không vào static manifest).
 */
export async function GET(_request: Request, ctx: RouteCtx) {
  const { path: segments } = await ctx.params;
  const abs = resolveUploadsAbsolutePath(segments);
  if (!abs) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const buf = await readFile(abs);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": uploadsContentType(abs),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
