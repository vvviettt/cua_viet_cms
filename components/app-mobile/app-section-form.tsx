"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createAppMobileSectionAction,
  updateAppMobileSectionAction,
  type AppMobileFormState,
} from "@/app/actions/app-mobile-config";
import { FileSourcePicker } from "@/components/ui/file-source-picker";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: AppMobileFormState = {};

type CreateProps = { mode: "create"; canEdit: boolean };
type EditProps = {
  mode: "edit";
  canEdit: boolean;
  sectionId: string;
  defaultTitle: string;
  defaultIconUrl?: string | null;
  defaultIconDisplayName?: string | null;
};

type Props = CreateProps | EditProps;

export function AppSectionForm(props: Props) {
  const router = useRouter();
  const action = props.mode === "create" ? createAppMobileSectionAction : updateAppMobileSectionAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (!state?.ok) return;
    router.push("/cau-hinh-app/trang-chu");
  }, [state?.ok, router]);

  if (!props.canEdit) {
    return <p className="text-sm text-zinc-600">Không có quyền chỉnh sửa.</p>;
  }

  const isEdit = props.mode === "edit";
  const defaultIconUrl = isEdit ? props.defaultIconUrl ?? null : null;
  const defaultIconDisplayName = isEdit ? props.defaultIconDisplayName ?? null : null;

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-4">
      {isEdit ? <input type="hidden" name="sectionId" value={props.sectionId} /> : null}
      {state?.error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state.error}
        </p>
      ) : null}

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

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
        <p className="text-sm font-semibold text-zinc-900">
          Icon nhóm <span className="text-red-600">*</span>
        </p>
        <p className="mt-1 text-xs text-zinc-600">Chỉ nhận SVG, tối đa 512KB.</p>

        <div className="mt-3">
          <FileSourcePicker
            mode="local-only"
            disabled={pending}
            localName="iconFile"
            localAccept=".svg,image/svg+xml"
            localTitle="Upload icon (SVG)"
            localEmptyLabel="Chưa chọn icon…"
            localButtonLabel="Chọn SVG"
          />
          {defaultIconUrl ? (
            <p className="mt-2 text-xs text-zinc-600">
              Icon hiện tại:{" "}
              <a
                href={defaultIconUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-(--portal-primary) underline underline-offset-2 hover:underline"
              >
                {defaultIconDisplayName?.trim() || "Xem"}
              </a>
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-zinc-700">
              Bạn cần chọn icon SVG cho nhóm trước khi lưu.
            </p>
          )}
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
  );
}
