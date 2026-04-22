"use client";

import { useActionState, useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOrUpdateWorkSchedule,
  type WorkScheduleFormState,
} from "@/app/actions/work-schedules";
import { FileLocalPickRow } from "@/components/ui/file-source-picker";
import type { ScheduleEditPrefill } from "@/lib/work-schedules/edit-prefill";
import {
  buildAutoScheduleTitle,
  clampIsoWeek,
  formatCalendarMonthValue,
  formatIsoWeekString,
  getCurrentIsoWeekValue,
  getCurrentMonthValue,
  maxIsoWeeksForIsoYear,
  parseCalendarMonthValue,
  parseIsoWeekString,
  PERIOD_KIND_LABELS,
  PERIOD_YEAR_MAX,
  PERIOD_YEAR_MIN,
  VI_MONTH_LABELS,
  type SchedulePeriodKind,
} from "@/lib/work-schedules/period";

export type ScheduleTypeOption = { id: string; label: string };

const PERIOD_YEAR_VALUES = Array.from(
  { length: PERIOD_YEAR_MAX - PERIOD_YEAR_MIN + 1 },
  (_, i) => PERIOD_YEAR_MIN + i,
);

const fieldSelectClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-[var(--portal-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-primary)]/25";

function initialScheduleFormState(
  scheduleTypes: ScheduleTypeOption[],
  prefill: ScheduleEditPrefill | null,
) {
  const defaultTypeId = scheduleTypes[0]?.id ?? "";
  const defaultTypeLabel = scheduleTypes.find((t) => t.id === defaultTypeId)?.label ?? "";
  if (!prefill || !scheduleTypes.some((t) => t.id === prefill.typeId)) {
    const wv = getCurrentIsoWeekValue();
    return {
      scheduleTypeId: defaultTypeId,
      periodKind: "week" as SchedulePeriodKind,
      weekValue: wv,
      monthValue: getCurrentMonthValue(),
      yearValue: String(new Date().getFullYear()),
      title: buildAutoScheduleTitle(defaultTypeLabel, "week", wv),
      titleManual: false,
    };
  }
  const typeLabel = scheduleTypes.find((t) => t.id === prefill.typeId)?.label ?? "";
  const pk = prefill.periodKind;
  const pv = prefill.periodValue;
  const titleFromPrefill = prefill.title?.trim();
  return {
    scheduleTypeId: prefill.typeId,
    periodKind: pk,
    weekValue: pk === "week" ? pv : getCurrentIsoWeekValue(),
    monthValue: pk === "month" ? pv : getCurrentMonthValue(),
    yearValue: pk === "year" ? pv : String(new Date().getFullYear()),
    title: titleFromPrefill || buildAutoScheduleTitle(typeLabel, pk, pv),
    titleManual: Boolean(titleFromPrefill),
  };
}

function WeekPeriodSelectsVi({
  weekValue,
  disabled,
  selectClassName,
  onChange,
}: {
  weekValue: string;
  disabled?: boolean;
  selectClassName: string;
  onChange: (isoWeek: string) => void;
}) {
  const fallback = parseIsoWeekString(getCurrentIsoWeekValue())!;
  const parsed = parseIsoWeekString(weekValue);
  const iy = parsed?.isoYear ?? fallback.isoYear;
  const iw = parsed?.week ?? fallback.week;
  const { isoYear, week: weekNum } = clampIsoWeek(iy, iw);
  const maxWeek = maxIsoWeeksForIsoYear(isoYear);
  const normalizedWeek = formatIsoWeekString(isoYear, weekNum);

  useLayoutEffect(() => {
    if (normalizedWeek !== weekValue) onChange(normalizedWeek);
  }, [normalizedWeek, weekValue, onChange]);

  return (
    <>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-zinc-700">Tuần theo lịch ISO 8601</legend>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[9rem] flex-1">
            <label htmlFor="iso-week-year" className="mb-1 block text-xs text-zinc-600">
              Năm (ISO)
            </label>
            <select
              id="iso-week-year"
              disabled={disabled}
              value={isoYear}
              className={selectClassName}
              onChange={(e) => {
                const y = Number(e.target.value);
                const c = clampIsoWeek(y, weekNum);
                onChange(formatIsoWeekString(c.isoYear, c.week));
              }}
            >
              {PERIOD_YEAR_VALUES.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[9rem] flex-1">
            <label htmlFor="iso-week-num" className="mb-1 block text-xs text-zinc-600">
              Tuần
            </label>
            <select
              id="iso-week-num"
              disabled={disabled}
              value={weekNum}
              className={selectClassName}
              onChange={(e) => {
                const w = Number(e.target.value);
                const c = clampIsoWeek(isoYear, w);
                onChange(formatIsoWeekString(c.isoYear, c.week));
              }}
            >
              {Array.from({ length: maxWeek }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  Tuần {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>
      <input type="hidden" name="week" value={normalizedWeek} required />
    </>
  );
}

function MonthPeriodSelectsVi({
  monthValue,
  disabled,
  selectClassName,
  onChange,
}: {
  monthValue: string;
  disabled?: boolean;
  selectClassName: string;
  onChange: (yyyyMm: string) => void;
}) {
  const fallback = parseCalendarMonthValue(getCurrentMonthValue())!;
  const parsed = parseCalendarMonthValue(monthValue);
  const year = parsed?.year ?? fallback.year;
  const month = parsed?.month ?? fallback.month;
  const normalizedMonth = formatCalendarMonthValue(year, month);

  useLayoutEffect(() => {
    if (normalizedMonth !== monthValue) onChange(normalizedMonth);
  }, [normalizedMonth, monthValue, onChange]);

  return (
    <>
      <fieldset className="space-y-2">
        <legend className="mb-1 text-sm font-medium text-zinc-700">Tháng dương lịch</legend>
        <div className="flex flex-wrap gap-3">
          <div className="min-w-44 flex-1">
            <select
              id="cal-month"
              disabled={disabled}
              value={month}
              className={selectClassName}
              onChange={(e) => {
                const m = Number(e.target.value);
                onChange(formatCalendarMonthValue(year, m));
              }}
            >
              {VI_MONTH_LABELS.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-36 flex-1">

            <select
              id="cal-month-year"
              disabled={disabled}
              value={year}
              className={selectClassName}
              onChange={(e) => {
                const y = Number(e.target.value);
                onChange(formatCalendarMonthValue(y, month));
              }}
            >
              {PERIOD_YEAR_VALUES.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>
      <input type="hidden" name="month" value={normalizedMonth} required />
    </>
  );
}

const initial: WorkScheduleFormState = {};

type Props = {
  /** `admin` và `editor` được phép tải lên; `viewer` không. */
  canUpload: boolean;
  scheduleTypes: ScheduleTypeOption[];
  /** Sau khi lưu thành công, chuyển tới URL này (vd. danh sách). */
  redirectOnSuccessHref?: string;
  /** Mở form với loại / kỳ / tiêu đề đã có (từ danh sách). */
  prefillFromList?: ScheduleEditPrefill | null;
  /** PDF đang lưu cho đúng kỳ (khi sửa từ danh sách). */
  existingUploadedFile?: { fileName: string; originalName: string } | null;
  /** Bản ghi đang sửa — dùng khi lưu không file (cập nhật tiêu đề theo id nếu kỳ trên form lệch URL). */
  existingWorkScheduleId?: string | null;
};

export function CreateScheduleForm({
  canUpload,
  scheduleTypes,
  redirectOnSuccessHref,
  prefillFromList = null,
  existingUploadedFile = null,
  existingWorkScheduleId = null,
}: Props) {
  const router = useRouter();
  const init = initialScheduleFormState(scheduleTypes, prefillFromList ?? null);
  const [scheduleTypeId, setScheduleTypeId] = useState(init.scheduleTypeId);
  const [periodKind, setPeriodKind] = useState<SchedulePeriodKind>(init.periodKind);
  const [weekValue, setWeekValue] = useState(init.weekValue);
  const [monthValue, setMonthValue] = useState(init.monthValue);
  const [yearValue, setYearValue] = useState(init.yearValue);
  const [title, setTitle] = useState(init.title);
  const [state, formAction, pending] = useActionState(createOrUpdateWorkSchedule, initial);
  const [titleManual, setTitleManual] = useState(init.titleManual);

  useEffect(() => {
    if (!state?.ok) return;
    if (redirectOnSuccessHref) {
      router.push(redirectOnSuccessHref);
      return;
    }
    // Reset toàn bộ form bằng cách reload để tránh setState trong effect.
    const t = window.setTimeout(() => window.location.reload(), 400);
    return () => window.clearTimeout(t);
  }, [state?.ok, redirectOnSuccessHref, router, scheduleTypes]);

  /** PDF mở từ server khi vào trang sửa — giữ tên/link trên hàng file cho đến khi user chọn PDF khác. */
  const showExistingPdfInPicker =
    existingUploadedFile != null && prefillFromList != null;

  const effectiveScheduleTypeId = scheduleTypes.some((t) => t.id === scheduleTypeId)
    ? scheduleTypeId
    : scheduleTypes[0]?.id ?? "";
  const scheduleTypeLabel = scheduleTypes.find((t) => t.id === effectiveScheduleTypeId)?.label ?? "";
  const periodValue =
    periodKind === "week" ? weekValue : periodKind === "month" ? monthValue : yearValue;
  const autoTitle = buildAutoScheduleTitle(scheduleTypeLabel, periodKind, periodValue);
  const effectiveTitle = titleManual ? title : autoTitle;

  if (!canUpload) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Tạo / cập nhật lịch</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Tài khoản <strong>Chỉ xem</strong> không được phép tải lên hoặc sửa lịch. Liên hệ quản trị viên nếu bạn
          cần quyền biên tập.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Tạo / cập nhật lịch</h2>


      <form action={formAction} className="mt-6 flex flex-col gap-4">
        {existingWorkScheduleId ? (
          <input type="hidden" name="workScheduleId" value={existingWorkScheduleId} />
        ) : null}
        {state?.error ? (
          <p
            className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Đã lưu lịch làm việc.
          </p>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="scheduleTypeId" className="mb-1 block text-sm font-medium text-zinc-700">
              Loại lịch
            </label>
            <select
              id="scheduleTypeId"
              name="scheduleTypeId"
              required
              value={effectiveScheduleTypeId}
              onChange={(e) => {
                setTitleManual(false);
                setScheduleTypeId(e.target.value);
              }}
              className="w-full max-w-xl rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-[var(--portal-primary)]/25"
            >
              {scheduleTypes.length === 0 ? (
                <option value="">— Chưa cấu hình loại lịch —</option>
              ) : (
                scheduleTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="periodKind" className="mb-1 block text-sm font-medium text-zinc-700">
              Kiểu thời gian
            </label>
            <select
              id="periodKind"
              name="periodKind"
              required
              value={periodKind}
              onChange={(e) => {
                setTitleManual(false);
                setPeriodKind(e.target.value as SchedulePeriodKind);
              }}
              className="w-full max-w-xl rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-[var(--portal-primary)]/25"
            >
              {(Object.keys(PERIOD_KIND_LABELS) as SchedulePeriodKind[]).map((k) => (
                <option key={k} value={k}>
                  {PERIOD_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            {periodKind === "week" ? (
              <WeekPeriodSelectsVi
                weekValue={weekValue}
                disabled={pending}
                selectClassName={fieldSelectClass}
                onChange={(next) => {
                  setTitleManual(false);
                  setWeekValue(next);
                }}
              />
            ) : null}
            {periodKind === "month" ? (
              <MonthPeriodSelectsVi
                monthValue={monthValue}
                disabled={pending}
                selectClassName={fieldSelectClass}
                onChange={(next) => {
                  setTitleManual(false);
                  setMonthValue(next);
                }}
              />
            ) : null}
            {periodKind === "year" ? (
              <>
                <label htmlFor="year" className="mb-1 block text-sm font-medium text-zinc-700">
                  Năm
                </label>
                <select
                  id="year"
                  name="year"
                  required
                  value={yearValue}
                  disabled={pending}
                  onChange={(e) => {
                    setTitleManual(false);
                    setYearValue(e.target.value);
                  }}
                  className={fieldSelectClass}
                >
                  {PERIOD_YEAR_VALUES.map((y) => (
                    <option key={y} value={String(y)}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-700">
              Tiêu đề hiển thị
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={effectiveTitle}
              placeholder="Ví dụ: Lịch tiếp dân tháng 2 năm 2026"
              onChange={(e) => {
                setTitleManual(true);
                setTitle(e.target.value);
              }}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-[var(--portal-primary)]/25"
            />
          </div>
        </div>

        <div className="space-y-3">
          <FileLocalPickRow
            name="file"
            accept="application/pdf,.pdf"
            disabled={pending}
            title={"File PDF"}
            emptyLabel="Chưa chọn tệp PDF…"
            buttonLabel="Chọn tệp"
            existingDisplayName={
              showExistingPdfInPicker && existingUploadedFile
                ? existingUploadedFile.originalName
                : null
            }
            existingFileHref={
              showExistingPdfInPicker && existingUploadedFile
                ? `/uploads/lich-lam-viec/${encodeURIComponent(existingUploadedFile.fileName)}`
                : undefined
            }
            existingFileLinkLabel="Xem PDF"
          />

        </div>

        <button
          type="submit"
          disabled={pending || scheduleTypes.length === 0}
          className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu lịch làm việc"}
        </button>
      </form>
    </section>
  );
}
