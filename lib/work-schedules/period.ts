import { getISOWeeksInYear } from "date-fns";

export const SCHEDULE_PERIOD_KINDS = ["week", "month", "year"] as const;

/** Năm dùng trong dropdown (dương lịch / ISO). */
export const PERIOD_YEAR_MIN = 1900;
export const PERIOD_YEAR_MAX = 2100;

/** Tên tháng tiếng Việt (tháng 1–12). */
export const VI_MONTH_LABELS = [
  "Tháng một",
  "Tháng hai",
  "Tháng ba",
  "Tháng tư",
  "Tháng năm",
  "Tháng sáu",
  "Tháng bảy",
  "Tháng tám",
  "Tháng chín",
  "Tháng mười",
  "Tháng mười một",
  "Tháng mười hai",
] as const;

export type SchedulePeriodKind = (typeof SCHEDULE_PERIOD_KINDS)[number];

export function isSchedulePeriodKind(v: string): v is SchedulePeriodKind {
  return (SCHEDULE_PERIOD_KINDS as readonly string[]).includes(v);
}

export const PERIOD_KIND_LABELS: Record<SchedulePeriodKind, string> = {
  week: "Tuần",
  month: "Tháng",
  year: "Năm",
};

/** Giá trị mặc định cho `<input type="week">` (YYYY-Www, tuần ISO 8601). */
export function getCurrentIsoWeekValue(date = new Date()): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const week1 = target.getTime();
  const week = 1 + Math.ceil((firstThursday - week1) / 604800000);
  const isoYear = new Date(firstThursday).getUTCFullYear();
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** Giá trị mặc định cho `<input type="month">` (YYYY-MM). */
export function getCurrentMonthValue(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Số tuần tối đa trong năm theo tuần ISO (52 hoặc 53). `isoYear` là năm theo ISO. */
export function maxIsoWeeksForIsoYear(isoYear: number): number {
  return getISOWeeksInYear(new Date(isoYear, 0, 4));
}

export function parseIsoWeekString(s: string): { isoYear: number; week: number } | null {
  const m = /^(\d{4})-W(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const isoYear = Number(m[1]);
  const week = Number(m[2]);
  if (!Number.isFinite(isoYear) || !Number.isFinite(week)) return null;
  return { isoYear, week };
}

export function formatIsoWeekString(isoYear: number, week: number): string {
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** Đảm bảo số tuần nằm trong [1, max] của năm ISO. */
export function clampIsoWeek(isoYear: number, week: number): { isoYear: number; week: number } {
  const max = maxIsoWeeksForIsoYear(isoYear);
  let w = Math.trunc(week);
  if (w < 1) w = 1;
  if (w > max) w = max;
  return { isoYear, week: w };
}

export function parseCalendarMonthValue(s: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || month < 1 || month > 12) return null;
  return { year, month };
}

export function formatCalendarMonthValue(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Phần thời gian trong tiêu đề tự đặt: "tuần 1 năm 2025", "tháng 2 năm 2026", "năm 2026".
 */
export function formatAutoTitlePeriodPhrase(
  kind: SchedulePeriodKind,
  value: string,
): string | null {
  if (kind === "week") {
    const m = /^(\d{4})-W(\d{2})$/.exec(value.trim());
    if (!m) return null;
    return `tuần ${parseInt(m[2]!, 10)} năm ${m[1]}`;
  }
  if (kind === "month") {
    const m = /^(\d{4})-(\d{2})$/.exec(value.trim());
    if (!m) return null;
    return `tháng ${parseInt(m[2]!, 10)} năm ${m[1]}`;
  }
  if (kind === "year") {
    const raw = value.trim();
    if (!/^\d{4}$/.test(raw)) return null;
    const y = parseInt(raw, 10);
    if (y < 1900 || y > 2100) return null;
    return `năm ${raw}`;
  }
  return null;
}

/** Tiêu đề gợi ý: "{nhãn loại} {cụm thời gian}". Nếu kỳ chưa hợp lệ, chỉ trả về nhãn loại. */
export function buildAutoScheduleTitle(
  typeLabel: string,
  kind: SchedulePeriodKind,
  periodValue: string,
): string {
  const phrase = formatAutoTitlePeriodPhrase(kind, periodValue);
  const label = typeLabel.trim();
  if (!label) return "";
  if (!phrase) return label;
  return `${label} ${phrase}`;
}

/** Hiển thị một dòng: ví dụ "Tuần 5 — 2026", "Tháng 4/2026", "Năm 2026" */
export function formatPeriodDisplay(kind: SchedulePeriodKind, value: string): string {
  if (kind === "week") {
    const m = /^(\d{4})-W(\d{2})$/.exec(value);
    if (!m) return value;
    return `Tuần ${parseInt(m[2]!, 10)} năm ${m[1]}`;
  }
  if (kind === "month") {
    const m = /^(\d{4})-(\d{2})$/.exec(value);
    if (!m) return value;
    const mo = parseInt(m[2]!, 10);
    const name = VI_MONTH_LABELS[mo - 1] ?? `Tháng ${mo}`;
    return `${name} năm ${m[1]}`;
  }
  if (kind === "year") {
    return `Năm ${value}`;
  }
  return value;
}
