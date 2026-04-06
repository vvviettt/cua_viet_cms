"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createStaffMember, type CreateStaffFormState } from "@/app/actions/staff-members";
import { FileLocalPickRow } from "@/components/ui/file-source-picker";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-[var(--portal-primary)]/25";

const initial: CreateStaffFormState = {};

type Props = {
  canEdit: boolean;
  redirectOnSuccessHref?: string;
};

export function CreateStaffForm({ canEdit, redirectOnSuccessHref }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createStaffMember, initial);

  useEffect(() => {
    if (!state?.ok) return;
    if (redirectOnSuccessHref) {
      router.push(redirectOnSuccessHref);
    }
  }, [state?.ok, redirectOnSuccessHref, router]);

  if (!canEdit) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Thêm cán bộ</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Tài khoản <strong>Chỉ xem</strong> không được phép thêm cán bộ. Liên hệ quản trị viên nếu bạn cần quyền
          biên tập.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Thêm cán bộ, công chức, viên chức</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Điền thông tin bắt buộc; ảnh đại diện và email là tùy chọn. Ảnh: JPG, PNG, WEBP hoặc GIF, tối đa 5MB.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
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
            Đã thêm cán bộ. Đang chuyển về danh sách…
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-zinc-700">
              Họ và tên <span className="text-red-600">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              maxLength={200}
              disabled={pending}
              className={fieldClass}
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>
          <div>
            <label htmlFor="jobTitle" className="mb-1 block text-sm font-medium text-zinc-700">
              Chức vụ <span className="text-red-600">*</span>
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              required
              maxLength={200}
              disabled={pending}
              className={fieldClass}
              placeholder="Ví dụ: Chuyên viên Phòng Nội vụ"
            />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="mb-1 block text-sm font-medium text-zinc-700">
              Ngày sinh
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              disabled={pending}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium text-zinc-700">
              Email liên hệ
            </label>
            <input
              id="contactEmail"
              name="contactEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={320}
              disabled={pending}
              className={fieldClass}
              placeholder="ten@example.gov.vn"
            />
          </div>
          <div>
            <label htmlFor="sortOrder" className="mb-1 block text-sm font-medium text-zinc-700">
              Thứ tự hiển thị
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              max={999999}
              defaultValue={0}
              disabled={pending}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-zinc-500">Số nhỏ hơn xếp trước trong danh sách.</p>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="isInactive"
              value="on"
              disabled={pending}
              className="mt-1 size-4 rounded border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)/25"
            />
            <span className="text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">Ngừng hiển thị</span>
              <span className="mt-0.5 block text-zinc-600">
                Đánh dấu nếu cán bộ không còn công tác hoặc không hiển thị công khai.
              </span>
            </span>
          </label>
        </div>

        <FileLocalPickRow
          name="avatar"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          disabled={pending}
          title="Ảnh đại diện (tuỳ chọn)"
          emptyLabel="Chưa chọn ảnh…"
          buttonLabel="Chọn ảnh"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu cán bộ"}
        </button>
      </form>
    </section>
  );
}
