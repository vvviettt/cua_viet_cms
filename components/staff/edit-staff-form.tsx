"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateStaffMember, type UpdateStaffFormState } from "@/app/actions/staff-members";
import { FileLocalPickRow } from "@/components/ui/file-source-picker";
import type { StaffMemberPublic } from "@/lib/staff-members/types";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: UpdateStaffFormState = {};

type Props = {
  member: StaffMemberPublic;
  canEdit: boolean;
  redirectOnSuccessHref?: string;
};

function avatarUploadsHref(relativePath: string): string {
  const segments = relativePath.split("/").map((s) => encodeURIComponent(s));
  return `/uploads/${segments.join("/")}`;
}

export function EditStaffForm({ member, canEdit, redirectOnSuccessHref }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateStaffMember, initial);

  useEffect(() => {
    if (!state?.ok) return;
    if (redirectOnSuccessHref) {
      router.push(redirectOnSuccessHref);
    }
  }, [state?.ok, redirectOnSuccessHref, router]);

  if (!canEdit) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Chỉnh sửa cán bộ</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Tài khoản <strong>Chỉ xem</strong> không được phép sửa thông tin cán bộ.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Chỉnh sửa thông tin</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Cập nhật các trường cần thiết. Để giữ ảnh hiện tại, không chọn file mới.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="staffId" value={member.id} />
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
            Đã cập nhật. Đang chuyển về danh sách…
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="edit-fullName" className="mb-1 block text-sm font-medium text-zinc-700">
              Họ và tên <span className="text-red-600">*</span>
            </label>
            <input
              id="edit-fullName"
              name="fullName"
              type="text"
              required
              maxLength={200}
              disabled={pending}
              defaultValue={member.fullName}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="edit-jobTitle" className="mb-1 block text-sm font-medium text-zinc-700">
              Chức vụ <span className="text-red-600">*</span>
            </label>
            <input
              id="edit-jobTitle"
              name="jobTitle"
              type="text"
              required
              maxLength={200}
              disabled={pending}
              defaultValue={member.jobTitle}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="edit-dateOfBirth" className="mb-1 block text-sm font-medium text-zinc-700">
              Ngày sinh
            </label>
            <input
              id="edit-dateOfBirth"
              name="dateOfBirth"
              type="date"
              disabled={pending}
              defaultValue={member.dateOfBirth ?? ""}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="edit-contactEmail" className="mb-1 block text-sm font-medium text-zinc-700">
              Email liên hệ
            </label>
            <input
              id="edit-contactEmail"
              name="contactEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={320}
              disabled={pending}
              defaultValue={member.contactEmail ?? ""}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="edit-sortOrder" className="mb-1 block text-sm font-medium text-zinc-700">
              Thứ tự hiển thị
            </label>
            <input
              id="edit-sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              max={999999}
              defaultValue={member.sortOrder}
              disabled={pending}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="isInactive"
              value="on"
              disabled={pending}
              defaultChecked={!member.isActive}
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
          title="Ảnh đại diện"
          emptyLabel="Chưa chọn ảnh mới…"
          buttonLabel="Chọn ảnh"
          existingDisplayName={
            member.avatarRelativePath ? "Ảnh đại diện hiện tại" : null
          }
          existingFileHref={
            member.avatarRelativePath
              ? avatarUploadsHref(member.avatarRelativePath)
              : undefined
          }
          existingFileLinkLabel="Xem ảnh"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </form>
    </section>
  );
}
