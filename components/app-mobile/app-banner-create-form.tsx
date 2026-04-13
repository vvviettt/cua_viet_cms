"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAppMobileBannerAction, type AppMobileFormState } from "@/app/actions/app-mobile-config";
import { FileLocalPickRow } from "@/components/ui/file-source-picker";

const initial: AppMobileFormState = {};

type Props = {
  canEdit: boolean;
  placement: "top" | "after_section_2";
  backTab: "banner";
};

export function AppBannerCreateForm({ canEdit, placement, backTab }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAppMobileBannerAction, initial);

  useEffect(() => {
    if (!state?.ok) return;
    router.push(`/cau-hinh-app?tab=${backTab}`);
  }, [state?.ok, router, backTab]);

  if (!canEdit) {
    return null;
  }

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Thêm ảnh banner</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Ảnh được thêm xuống cuối danh sách. Sắp xếp và bật/tắt hiển thị trên trang danh sách cấu hình.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="placement" value={placement} />
        <input type="hidden" name="backTab" value={backTab} />
        {state?.error ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
            {state.error}
          </p>
        ) : null}

        <FileLocalPickRow
          name="banner"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          disabled={pending}
          title="File ảnh (bắt buộc)"
          emptyLabel="Chưa chọn ảnh…"
          buttonLabel="Chọn ảnh"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Link khi bấm banner (tuỳ chọn)</label>
          <input
            name="redirectUrl"
            type="url"
            inputMode="url"
            placeholder="https://…"
            disabled={pending}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25"
          />
          <p className="mt-1 text-xs text-zinc-500">Nếu có, app sẽ mở link trong WebView.</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
        >
          {pending ? "Đang tải lên…" : "Tải lên"}
        </button>
      </form>
    </section>
  );
}
