import { NextResponse } from "next/server";
import {
  listPublicWorkSchedulesAllActiveTypesPaginated,
  listPublicWorkSchedulesByTypeCode,
} from "@/lib/work-schedules/store";

const TYPE_CODE_RE = /^[a-z0-9_]{1,64}$/i;

const MAX_PAGE_SIZE = 50;

function pdfPath(fileName: string): string {
  return `/uploads/lich-lam-viec/${encodeURIComponent(fileName)}`;
}

function parsePositiveInt(raw: string | null, fallback: number, max?: number): number {
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  if (max != null && n > max) return max;
  return n;
}

/**
 * Danh sách lịch (PDF) — công khai.
 *
 * Query: `typeCode` (bỏ trống = tất cả loại đang active), `page`, `pageSize`
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const typeCodeRaw = url.searchParams.get("typeCode")?.trim() ?? "";
  const filterByType = typeCodeRaw.length > 0;

  if (filterByType && !TYPE_CODE_RE.test(typeCodeRaw)) {
    return NextResponse.json({ error: "typeCode không hợp lệ." }, { status: 400 });
  }

  const typeCode = filterByType ? typeCodeRaw.toLowerCase() : null;

  const page = parsePositiveInt(url.searchParams.get("page"), 1);
  const pageSize = parsePositiveInt(url.searchParams.get("pageSize"), 20, MAX_PAGE_SIZE);

  try {
    const { items, total, page: safePage, pageSize: size } =
      filterByType && typeCode != null
        ? await listPublicWorkSchedulesByTypeCode(typeCode, page, pageSize)
        : await listPublicWorkSchedulesAllActiveTypesPaginated(page, pageSize);

    return NextResponse.json({
      typeCode,
      page: safePage,
      pageSize: size,
      total,
      items: items.map((row) => ({
        id: row.id,
        typeCode: row.typeCode,
        typeLabel: row.typeLabel,
        periodKind: row.periodKind,
        periodValue: row.periodValue,
        title: row.title,
        originalName: row.originalName,
        updatedAt: row.updatedAt,
        pdfPath: pdfPath(row.fileName),
      })),
    });
  } catch (e) {
    console.error("[api/public/work-schedules]", e);
    return NextResponse.json({ error: "Không tải được danh sách lịch." }, { status: 500 });
  }
}
