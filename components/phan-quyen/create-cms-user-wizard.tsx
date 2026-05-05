"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCmsUser, type CreateCmsUserState } from "@/app/actions/cms-users";
import { UserModulePermissionsForm } from "@/components/phan-quyen/user-module-permissions-form";
import { cn } from "@/lib/utils";

const initial: CreateCmsUserState = {};

type Props = {
  /** Gọi khi tạo xong (quản trị) hoặc bấm Xong ở bước phân quyền (người dùng CMS). */
  onComplete: () => void;
};

export function CreateCmsUserWizard(props: Props) {
  const { onComplete } = props;
  const [state, formAction, pending] = useActionState(createCmsUser, initial);
  const [step, setStep] = useState<1 | 2>(1);
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [permissionsJson, setPermissionsJson] = useState("[]");
  const submitHandled = useRef(false);

  useEffect(() => {
    if (!state.ok || !state.userId || submitHandled.current) {
      return;
    }
    submitHandled.current = true;
    if (state.createdAsAdmin) {
      onComplete();
      return;
    }
    setNewUserId(state.userId);
    setStep(2);
    setPermissionsJson("[]");
  }, [state.ok, state.userId, state.createdAsAdmin, onComplete]);

  return (
    <div className="w-full">
      <div className="mb-5 flex gap-2 text-sm font-medium text-zinc-500">
        <span
          className={cn(
            "rounded-full px-3 py-1",
            step === 1 ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600",
          )}
        >
          1 · Thông tin
        </span>
        <span
          className={cn(
            "rounded-full px-3 py-1",
            step === 2 ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600",
          )}
        >
          2 · Quyền module
        </span>
      </div>

      {step === 1 ? (
        <form action={formAction} className="space-y-5">
          {state.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {state.error}
            </p>
          ) : null}

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-zinc-800">Vai trò</legend>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-200 px-3 py-3 text-sm hover:border-zinc-300">
              <input
                type="radio"
                name="cmsRole"
                value="cms"
                defaultChecked
                className="mt-0.5 h-4 w-4 border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
              />
              <span>
                <span className="font-medium text-zinc-900">Người dùng CMS</span>
                <span className="mt-0.5 block text-zinc-600">Bước sau: gán quyền đọc/chỉnh sửa theo module.</span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-zinc-200 px-3 py-3 text-sm hover:border-zinc-300">
              <input
                type="radio"
                name="cmsRole"
                value="admin"
                className="mt-0.5 h-4 w-4 border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
              />
              <span>
                <span className="font-medium text-zinc-900">Quản trị viên</span>
                <span className="mt-0.5 block text-zinc-600">Toàn quyền CMS; không cần chọn module.</span>
              </span>
            </label>
          </fieldset>

          <div>
            <label htmlFor="cms-new-fullName" className="mb-1 block text-sm font-medium text-zinc-700">
              Họ tên
            </label>
            <input
              id="cms-new-fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-(--portal-primary) focus:ring-2 focus:ring-(--portal-primary)/25"
            />
          </div>

          <div>
            <label htmlFor="cms-new-email" className="mb-1 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="cms-new-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-(--portal-primary) focus:ring-2 focus:ring-(--portal-primary)/25"
            />
          </div>

          <div>
            <label htmlFor="cms-new-password" className="mb-1 block text-sm font-medium text-zinc-700">
              Mật khẩu
            </label>
            <input
              id="cms-new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-(--portal-primary) focus:ring-2 focus:ring-(--portal-primary)/25"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full cursor-pointer rounded-xl bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? "Đang tạo…" : "Tiếp"}
          </button>
        </form>
      ) : newUserId ? (
        <div className="space-y-5">
          <p className="text-sm text-zinc-600">Gán quyền theo module. Có thể bỏ qua và chỉnh sau trong danh sách.</p>
          <UserModulePermissionsForm userId={newUserId} permissionsJson={permissionsJson} />
          <button
            type="button"
            onClick={() => onComplete()}
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-all duration-200 active:scale-[0.99]"
          >
            Xong
          </button>
        </div>
      ) : null}
    </div>
  );
}
