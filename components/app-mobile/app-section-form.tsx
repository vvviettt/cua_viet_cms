"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createAppMobileSectionAction,
  updateAppMobileSectionAction,
  type AppMobileFormState,
} from "@/app/actions/app-mobile-config";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: AppMobileFormState = {};

type CreateProps = { mode: "create"; canEdit: boolean };
type EditProps = {
  mode: "edit";
  canEdit: boolean;
  sectionId: string;
  defaultTitle: string;
};

type Props = CreateProps | EditProps;

export function AppSectionForm(props: Props) {
  const router = useRouter();
  const action = props.mode === "create" ? createAppMobileSectionAction : updateAppMobileSectionAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (!state?.ok) return;
    router.push("/cau-hinh-app?tab=menu");
  }, [state?.ok, router]);

  if (!props.canEdit) {
    return <p className="text-sm text-zinc-600">Không có quyền chỉnh sửa.</p>;
  }

  const isEdit = props.mode === "edit";

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-4">
      {isEdit ? <input type="hidden" name="sectionId" value={props.sectionId} /> : null}
      {state?.error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state.error}
        </p>
      ) : null}

      <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        Thứ tự nhóm và hiển thị trên app chỉnh ở trang danh sách (mũi tên + tick).
      </p>

      <div>
        <label htmlFor="sec-title" className="mb-1 block text-sm font-medium text-zinc-700">
          Tên nhóm <span className="text-red-600">*</span>
        </label>
        <input
          id="sec-title"
          name="title"
          type="text"
          required
          maxLength={200}
          disabled={pending}
          defaultValue={isEdit ? props.defaultTitle : undefined}
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
      >
        {pending ? "Đang lưu…" : "Lưu"}
      </button>
    </form>
  );
}
