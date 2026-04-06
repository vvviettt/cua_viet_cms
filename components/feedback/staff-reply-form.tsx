"use client";

import { useActionState } from "react";
import {
  saveCitizenFeedbackStaffReply,
  type CitizenFeedbackFormState,
} from "@/app/actions/citizen-feedback";
import type { CitizenFeedbackRecord } from "@/lib/citizen-feedback/types";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: CitizenFeedbackFormState = {};

type Props = {
  record: CitizenFeedbackRecord;
  canEdit: boolean;
};

export function StaffReplyForm({ record, canEdit }: Props) {
  const [state, formAction, pending] = useActionState(saveCitizenFeedbackStaffReply, initial);

  return (
    <div className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">Trả lời người dân</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Nội dung này dành cho người dân xem trên ứng dụng.
      </p>

      

      {canEdit ? (
        <form key={record.updatedAt} action={formAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="feedbackId" value={record.id} />
          {state?.error ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Đã lưu trả lời.
            </p>
          ) : null}

          <div>
            <label htmlFor="staff-reply-body" className="mb-1 block text-sm font-medium text-zinc-700">
              Soạn / chỉnh sửa trả lời
            </label>
            <textarea
              id="staff-reply-body"
              name="staffReply"
              rows={10}
              maxLength={20000}
              disabled={pending}
              defaultValue={record.staffReply ?? ""}
              className={`${fieldClass} resize-y`}
              placeholder="Kính gửi… UBND phường trả lời như sau…"
            />
            <p className="mt-1 text-xs text-zinc-500">Tối đa 20.000 ký tự. Để trống và lưu để xóa bản trả lời đã gửi.</p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
          >
            {pending ? "Đang lưu…" : "Lưu trả lời"}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">Bạn chỉ có quyền xem.</p>
      )}
    </div>
  );
}
