import { NextResponse } from "next/server";
import { listActiveStaffMembersPublic } from "@/lib/db/staff-member-ratings";
import { uploadsPublicHref } from "@/lib/uploads/public-url";

/** Danh sách cán bộ đang công tác — dùng cho ứng dụng (đánh giá cán bộ). */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? undefined;
    const rows = await listActiveStaffMembersPublic({ query: q });
    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        jobTitle: r.jobTitle,
        avatarUrl: r.avatarRelativePath ? uploadsPublicHref(r.avatarRelativePath) : null,
        contactEmail: r.contactEmail,
        sortOrder: r.sortOrder,
      })),
    });
  } catch (e) {
    console.error("[api/public/staff-members]", e);
    return NextResponse.json({ error: "Không tải được danh sách cán bộ." }, { status: 500 });
  }
}

