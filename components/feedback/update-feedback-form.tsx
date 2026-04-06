"use client";

import { useActionState } from "react";
import {
  updateCitizenFeedbackEntry,
  type CitizenFeedbackFormState,
} from "@/app/actions/citizen-feedback";
import type { CitizenFeedbackRecord, CitizenFeedbackStatus } from "@/lib/citizen-feedback/types";
import { FEEDBACK_STATUS_LABELS } from "@/lib/citizen-feedback/types";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: CitizenFeedbackFormState = {};

const STATUS_OPTIONS: CitizenFeedbackStatus[] = ["received", "processing", "answered", "closed"];

type Props = {
  record: CitizenFeedbackRecord;
  canEdit: boolean;
};

export function UpdateFeedbackForm({ record, canEdit }: Props) {
  const [state, formAction, pending] = useActionState(updateCitizenFeedbackEntry, initial);

  if (!canEdit) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-zinc-50 p-4 text-sm text-zinc-600">
        Bạn chỉ có quyền xem. Chỉ tài khoản biên tập trở lên mới cập nhật trạng thái xử lý.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">Trạng thái và ghi chú nội bộ</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Chỉ dùng trong CMS; phần «Trả lời người dân» là nội dung hiển thị trên ứng dụng.
      </p>
      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="feedbackId" value={record.id} />
        {state?.error ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Đã cập nhật trạng thái và ghi chú.
          </p>
        ) : null}

        <div>
          <label htmlFor="fb-status" className="mb-1 block text-sm font-medium text-zinc-700">
            Trạng thái
          </label>
          <select
            id="fb-status"
            name="status"
            required
            disabled={pending}
            defaultValue={record.status}
            className={fieldClass}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {FEEDBACK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3">
          <input
            id="fb-hidden-app"
            name="hiddenFromApp"
            type="checkbox"
            value="on"
            defaultChecked={record.hiddenFromApp}
            disabled={pending}
            className="mt-1 size-4 shrink-0 rounded border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
          />
          <div>
            <label htmlFor="fb-hidden-app" className="text-sm font-medium text-zinc-800">
              Ẩn khỏi ứng dụng người dân
            </label>
            <p className="mt-0.5 text-xs text-zinc-600">
              Bật nếu không muốn hồ sơ xuất hiện trong danh sách/chi tiết trên app .
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="fb-admin-note" className="mb-1 block text-sm font-medium text-zinc-700">
            Ghi chú nội bộ
          </label>
          <textarea
            id="fb-admin-note"
            name="adminNote"
            rows={5}
            maxLength={10000}
            disabled={pending}
            defaultValue={record.adminNote ?? ""}
            className={`${fieldClass} resize-y`}
            placeholder="Tiến độ xử lý, số hồ sơ liên quan…"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Cập nhật"}
        </button>
      </form>
    </section>
  );
}
