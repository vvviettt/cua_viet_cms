"use client";

import { useActionState } from "react";
import {
  deletePublicHotlineFormAction,
  updatePublicHotlineEntry,
  type PublicHotlineFormState,
} from "@/app/actions/public-hotlines";
import type { PublicHotlineRow } from "@/lib/db/public-hotlines";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: PublicHotlineFormState = {};

type Props = {
  row: PublicHotlineRow;
  canEdit: boolean;
};

export function EditHotlineForm({ row, canEdit }: Props) {
  const [state, formAction, pending] = useActionState(updatePublicHotlineEntry, initial);

  if (!canEdit) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-zinc-50 p-4 text-sm text-zinc-600">
        Bạn chỉ có quyền xem. Chỉ tài khoản biên tập trở lên mới chỉnh sửa.
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Chỉnh sửa đường dây nóng</h2>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="hotlineId" value={row.id} />
          {state?.error ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Đã cập nhật.
            </p>
          ) : null}

          <div>
            <label htmlFor="hl-edit-service" className="mb-1 block text-sm font-medium text-zinc-700">
              Tên dịch vụ / bộ phận <span className="text-red-600">*</span>
            </label>
            <input
              id="hl-edit-service"
              name="serviceName"
              type="text"
              required
              maxLength={200}
              disabled={pending}
              defaultValue={row.serviceName}
              className={fieldClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="hl-edit-phone" className="mb-1 block text-sm font-medium text-zinc-700">
                Số điện thoại <span className="text-red-600">*</span>
              </label>
              <input
                id="hl-edit-phone"
                name="phone"
                type="tel"
                required
                maxLength={40}
                disabled={pending}
                defaultValue={row.phone}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="hl-edit-order" className="mb-1 block text-sm font-medium text-zinc-700">
                Thứ tự hiển thị
              </label>
              <input
                id="hl-edit-order"
                name="sortOrder"
                type="number"
                disabled={pending}
                defaultValue={row.sortOrder}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="hl-edit-note" className="mb-1 block text-sm font-medium text-zinc-700">
              Ghi chú
            </label>
            <textarea
              id="hl-edit-note"
              name="note"
              rows={3}
              maxLength={500}
              disabled={pending}
              defaultValue={row.note ?? ""}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3">
            <input
              id="hl-edit-active"
              name="isActive"
              type="checkbox"
              value="on"
              defaultChecked={row.isActive}
              disabled={pending}
              className="mt-1 size-4 shrink-0 rounded border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
            />
            <div>
              <label htmlFor="hl-edit-active" className="text-sm font-medium text-zinc-800">
                Hiển thị trên ứng dụng / cổng
              </label>
            </div>
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

      <section className="rounded-xl border border-red-200 bg-red-50/40 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-red-900">Xóa</h2>
        <p className="mt-1 text-sm text-red-800/90">Xóa vĩnh viễn mục này khỏi hệ thống.</p>
        <form action={deletePublicHotlineFormAction} className="mt-4">
          <input type="hidden" name="hotlineId" value={row.id} />
          <button
            type="submit"
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-50"
            onClick={(e) => {
              if (!confirm("Xóa vĩnh viễn đường dây nóng này?")) e.preventDefault();
            }}
          >
            Xóa
          </button>
        </form>
      </section>
    </div>
  );
}
