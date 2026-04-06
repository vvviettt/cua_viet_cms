import { isSchedulePeriodKind, type SchedulePeriodKind } from "@/lib/work-schedules/period";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ScheduleEditPrefill = {
  typeId: string;
  periodKind: SchedulePeriodKind;
  periodValue: string;
  title?: string;
};

function firstString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

/** Đọc query từ URL trang cập nhật (`typeId`, `periodKind`, `periodValue`, tuỳ chọn `title`). */
export function parseScheduleEditPrefill(
  sp: Record<string, string | string[] | undefined>,
): ScheduleEditPrefill | null {
  const typeId = firstString(sp.typeId).trim();
  const periodKindRaw = firstString(sp.periodKind).trim();
  const periodValue = firstString(sp.periodValue).trim();
  const title = firstString(sp.title).trim();
  if (!typeId || !UUID_RE.test(typeId)) return null;
  if (!isSchedulePeriodKind(periodKindRaw)) return null;
  if (!periodValue) return null;
  if (periodKindRaw === "week" && !/^\d{4}-W\d{2}$/.test(periodValue)) return null;
  if (periodKindRaw === "month" && !/^\d{4}-\d{2}$/.test(periodValue)) return null;
  if (periodKindRaw === "year" && !/^\d{4}$/.test(periodValue)) return null;
  if (periodKindRaw === "year") {
    const y = parseInt(periodValue, 10);
    if (y < 1900 || y > 2100) return null;
  }
  return {
    typeId,
    periodKind: periodKindRaw,
    periodValue,
    title: title || undefined,
  };
}

export function scheduleEditQueryString(row: {
  typeId: string;
  periodKind: SchedulePeriodKind;
  periodValue: string;
  title: string;
}): string {
  const params = new URLSearchParams({
    typeId: row.typeId,
    periodKind: row.periodKind,
    periodValue: row.periodValue,
  });
  if (row.title.trim()) params.set("title", row.title.trim());
  return params.toString();
}
