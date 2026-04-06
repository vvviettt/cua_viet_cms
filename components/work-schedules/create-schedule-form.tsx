"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createOrUpdateWorkSchedule,
  type WorkScheduleFormState,
} from "@/app/actions/work-schedules";

const initial: WorkScheduleFormState = {};

type Props = {
  /** `admin` và `editor` được phép tải lên; `viewer` không. */
  canUpload: boolean;
};

export function CreateScheduleForm({ canUpload }: Props) {
  const [state, formAction, pending] = useActionState(createOrUpdateWorkSchedule, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state?.ok]);

  if (!canUpload) {
    return (
      <section className="rounded-xl border border-[var(--portal-border)] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Tạo / cập nhật lịch theo tuần</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Tài khoản <strong>Chỉ xem</strong> không được phép tải lên hoặc sửa lịch. Liên hệ quản trị viên nếu bạn
          cần quyền biên tập.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[var(--portal-border)] bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Tạo / cập nhật lịch theo tuần</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Chọn tuần (theo năm — tuần ISO), tải lên file PDF. Cùng một tuần sẽ được thay thế bản mới.
      </p>

      <form ref={formRef} action={formAction} className="mt-6 flex flex-col gap-4">
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
            <label htmlFor="week" className="mb-1 block text-sm font-medium text-zinc-700">
              Tuần
            </label>
            <input
              id="week"
              name="week"
              type="week"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-[var(--portal-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-primary)]/25"
            />
          </div>
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-700">
              Tiêu đề hiển thị (tuỳ chọn)
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Để trống sẽ tự đặt theo tuần"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-[var(--portal-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--portal-primary)]/25"
            />
          </div>
        </div>

        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium text-zinc-700">
            File PDF
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--portal-primary)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[var(--portal-primary-hover)]"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-[var(--portal-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--portal-primary-hover)] disabled:opacity-60"
        >
          {pending ? "Đang tải lên…" : "Lưu lịch làm việc"}
        </button>
      </form>
    </section>
  );
}
