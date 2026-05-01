"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo } from "react";
import { createCmsUser, type CreateCmsUserState } from "@/app/actions/cms-users";
import { UserModulePermissionsForm } from "@/components/phan-quyen/user-module-permissions-form";
import { cn } from "@/lib/utils";

const initial: CreateCmsUserState = {};

type Props = {
  resumeStep2UserId?: string;
  resumePermissionsJson?: string;
  adminResumeBlock?: boolean;
};

export function CreateCmsUserWizard(props: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createCmsUser, initial);

  const step2FromServer =
    Boolean(props.resumeStep2UserId) &&
    typeof props.resumePermissionsJson === "string" &&
    !props.adminResumeBlock;

  const step = step2FromServer ? 2 : 1;
  const permUserId = props.resumeStep2UserId ?? null;
  const permissionsJson = useMemo(
    () => props.resumePermissionsJson ?? "[]",
    [props.resumePermissionsJson],
  );

  useEffect(() => {
    if (state.ok && state.userId) {
      router.replace(
        `/phan-quyen/them?buoc=2&userId=${encodeURIComponent(state.userId)}`,
      );
    }
  }, [state.ok, state.userId, router]);

  if (props.adminResumeBlock) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        Không gán quyền module cho quản trị viên.
        <div className="mt-4">
          <Link
            href="/phan-quyen"
            className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
          >
            ← Phân quyền
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full">
      <div className="mb-6 flex gap-2 text-sm font-medium text-zinc-500">
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
          2 · Quyền
        </span>
      </div>

      {step === 1 ? (
        <form action={formAction} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
          {state.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {state.error}
            </p>
          ) : null}

          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-zinc-700">
              Họ tên
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-[var(--portal-primary)] focus:ring-2 focus:ring-[var(--portal-primary)]/25"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-[var(--portal-primary)] focus:ring-2 focus:ring-[var(--portal-primary)]/25"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">
              Mật khẩu
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none focus:border-[var(--portal-primary)] focus:ring-2 focus:ring-[var(--portal-primary)]/25"
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
      ) : permUserId ? (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-6">
            <p className="text-sm text-zinc-600">Gán quyền theo module. Có thể bỏ qua và chỉnh sau.</p>
            <div className="mt-4">
              <UserModulePermissionsForm userId={permUserId} permissionsJson={permissionsJson} />
            </div>
          </div>
          <Link
            href={`/phan-quyen?userId=${encodeURIComponent(permUserId)}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition-all duration-200 active:scale-[0.99]"
          >
            Xong
          </Link>
        </div>
      ) : null}
    </div>
  );
}
