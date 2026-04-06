"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createPublicHotlineEntry,
  type PublicHotlineFormState,
} from "@/app/actions/public-hotlines";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: PublicHotlineFormState = {};

type Props = {
  canEdit: boolean;
  redirectOnSuccessHref?: string;
};

export function CreateHotlineForm({ canEdit, redirectOnSuccessHref }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createPublicHotlineEntry, initial);

  useEffect(() => {
    if (!state?.ok) return;
    if (redirectOnSuccessHref) router.push(redirectOnSuccessHref);
  }, [state?.ok, redirectOnSuccessHref, router]);

  if (!canEdit) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Thêm đường dây nóng</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Tài khoản <strong>Chỉ xem</strong> không được thêm. Liên hệ quản trị viên nếu cần quyền biên tập.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Thêm số đường dây nóng</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Nhập tên dịch vụ công và số điện thoại người dân có thể gọi. Có thể thêm ghi chú (giờ làm việc…).
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        {state?.error ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Đã thêm. Đang chuyển về danh sách…
          </p>
        ) : null}

        <div>
          <label htmlFor="hl-service" className="mb-1 block text-sm font-medium text-zinc-700">
            Tên dịch vụ / bộ phận <span className="text-red-600">*</span>
          </label>
          <input
            id="hl-service"
            name="serviceName"
            type="text"
            required
            maxLength={200}
            disabled={pending}
            className={fieldClass}
            placeholder="Ví dụ: Bộ phận Một cửa"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="hl-phone" className="mb-1 block text-sm font-medium text-zinc-700">
              Số điện thoại <span className="text-red-600">*</span>
            </label>
            <input
              id="hl-phone"
              name="phone"
              type="tel"
              required
              maxLength={40}
              disabled={pending}
              className={fieldClass}
              placeholder="Ví dụ: 0210 3xxx xxx"
            />
          </div>
          <div>
            <label htmlFor="hl-order" className="mb-1 block text-sm font-medium text-zinc-700">
              Thứ tự hiển thị
            </label>
            <input
              id="hl-order"
              name="sortOrder"
              type="number"
              defaultValue={0}
              disabled={pending}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-zinc-500">Số nhỏ hơn hiển thị trước.</p>
          </div>
        </div>

        <div>
          <label htmlFor="hl-note" className="mb-1 block text-sm font-medium text-zinc-700">
            Ghi chú
          </label>
          <textarea
            id="hl-note"
            name="note"
            rows={3}
            maxLength={500}
            disabled={pending}
            className={`${fieldClass} resize-y`}
            placeholder="Giờ làm việc, nội dung tư vấn…"
          />
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3">
          <input
            id="hl-active"
            name="isActive"
            type="checkbox"
            value="on"
            defaultChecked
            disabled={pending}
            className="mt-1 size-4 shrink-0 rounded border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
          />
          <div>
            <label htmlFor="hl-active" className="text-sm font-medium text-zinc-800">
              Hiển thị trên ứng dụng / cổng
            </label>
            <p className="mt-0.5 text-xs text-zinc-600">Bỏ chọn để tạm ẩn khỏi danh sách công khai.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu"}
        </button>
      </form>
    </section>
  );
}
