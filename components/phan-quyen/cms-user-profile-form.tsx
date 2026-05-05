"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { updateCmsUserProfileAction, type UpdateCmsUserProfileState } from "@/app/actions/cms-users";
import type { AdminUserListItem } from "@/lib/db/users";

const profileInitial: UpdateCmsUserProfileState = {};

type Props = {
  user: AdminUserListItem;
};

/** Chỉ phần chỉnh họ tên, email, mật khẩu (dialog Chi tiết). */
export function CmsUserProfileForm(props: Props) {
  const { user } = props;
  const router = useRouter();
  const [profileState, profileAction, profilePending] = useActionState(
    updateCmsUserProfileAction,
    profileInitial,
  );

  useEffect(() => {
    if (profileState.ok) {
      router.refresh();
    }
  }, [profileState.ok, router]);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-900">Thông tin tài khoản</h3>
      <form
        key={`profile-${user.id}-${user.updatedAt}`}
        action={profileAction}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white px-4 py-4 sm:px-5"
      >
        <input type="hidden" name="userId" value={user.id} />
        <div>
          <label htmlFor={`fullName-${user.id}`} className="mb-1 block text-sm font-medium text-zinc-700">
            Họ tên
          </label>
          <input
            id={`fullName-${user.id}`}
            name="fullName"
            type="text"
            defaultValue={user.fullName ?? ""}
            autoComplete="name"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-(--portal-primary) focus:ring-2 focus:ring-(--portal-primary)/25"
          />
        </div>
        <div>
          <label htmlFor={`email-${user.id}`} className="mb-1 block text-sm font-medium text-zinc-700">
            Email đăng nhập
          </label>
          <input
            id={`email-${user.id}`}
            name="email"
            type="email"
            required
            defaultValue={user.email}
            autoComplete="email"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-(--portal-primary) focus:ring-2 focus:ring-(--portal-primary)/25"
          />
        </div>
        <div>
          <label htmlFor={`passwordNew-${user.id}`} className="mb-1 block text-sm font-medium text-zinc-700">
            Mật khẩu mới
          </label>
          <input
            id={`passwordNew-${user.id}`}
            name="passwordNew"
            type="password"
            autoComplete="new-password"
            placeholder="Để trống nếu giữ mật khẩu hiện tại"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-(--portal-primary) focus:ring-2 focus:ring-(--portal-primary)/25"
          />
          <p className="mt-1 text-xs text-zinc-500">Tối thiểu 8 ký tự khi đổi mật khẩu.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={profilePending}
            className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-50 transition-transform active:scale-[0.99] disabled:opacity-60"
          >
            {profilePending ? "Đang lưu…" : "Lưu thông tin"}
          </button>
          {profileState.error ? (
            <p className="text-sm text-red-600" role="status">
              {profileState.error}
            </p>
          ) : null}
          {profileState.ok ? (
            <p className="text-sm font-medium text-emerald-700" role="status">
              Đã lưu
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
