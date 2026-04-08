"use client";

import { useActionState, useEffect } from "react";
import { updateAppMobileThemeAction, type AppMobileFormState } from "@/app/actions/app-mobile-config";
import { AppMobileHexField } from "./app-mobile-hex-field";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: AppMobileFormState = {};

type Props = {
  canEdit: boolean;
  defaultPrimaryHex: string;
  defaultHeroTitle: string;
};

export function AppThemeForm({ canEdit, defaultPrimaryHex, defaultHeroTitle }: Props) {
  const [state, formAction, pending] = useActionState(updateAppMobileThemeAction, initial);

  useEffect(() => {
    if (!state?.ok) return;
    const t = window.setTimeout(() => window.location.reload(), 600);
    return () => window.clearTimeout(t);
  }, [state?.ok]);

  if (!canEdit) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Giao diện ứng dụng</h2>
        <p className="mt-2 text-sm text-zinc-600">Tài khoản chỉ xem không chỉnh được cấu hình.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Màu & tiêu đề trang chủ app</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Màu chủ đạo dùng làm seed cho theme Material; tiêu đề hiển thị trên banner. Để trống thì app chỉ hiện
        ảnh, không có lớp tối và không có chữ.
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
            Đã lưu.
          </p>
        ) : null}

        <AppMobileHexField
          name="primarySeedHex"
          label="Màu chủ đạo"
          defaultHex={defaultPrimaryHex}
          disabled={pending}
          helperText="Dùng bảng màu; mã hex gửi lên dạng #RRGGBB."
        />

        <div>
          <label htmlFor="app-hero" className="mb-1 block text-sm font-medium text-zinc-700">
            Tiêu đề trên banner <span className="font-normal text-zinc-500">(tùy chọn)</span>
          </label>
          <textarea
            id="app-hero"
            name="homeHeroTitle"
            rows={3}
            maxLength={500}
            disabled={pending}
            defaultValue={defaultHeroTitle}
            className={`${fieldClass} resize-y`}
          />
          <p className="mt-1 text-xs text-zinc-500">Xuống dòng trong app theo ký tự xuống dòng bạn nhập.</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu giao diện"}
        </button>
      </form>
    </section>
  );
}
