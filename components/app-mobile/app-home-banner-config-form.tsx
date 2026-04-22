"use client";

import { useActionState, useEffect, useState } from "react";
import {
  updateAppMobileHomeBannerAction,
  type AppMobileFormState,
} from "@/app/actions/app-mobile-config";
import { AppMobileHomeBannerMenuPanel } from "@/components/app-mobile/app-mobile-home-banner-menu-panel";
import type { AppMobileListHomeBannerSection } from "@/components/app-mobile/app-mobile-config-types";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";

type Props = {
  canEdit: boolean;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultApplyLabel: string;
  defaultLookupLabel: string;
  applySections: AppMobileListHomeBannerSection[];
  lookupSections: AppMobileListHomeBannerSection[];
};

const initial: AppMobileFormState = {};

export function AppHomeBannerConfigForm({
  canEdit,
  defaultTitle,
  defaultSubtitle,
  defaultApplyLabel,
  defaultLookupLabel,
  applySections,
  lookupSections,
}: Props) {
  const [state, formAction, pending] = useActionState(updateAppMobileHomeBannerAction, initial);
  const [tab, setTab] = useState<"apply" | "lookup">("apply");

  useEffect(() => {
    if (!state?.ok) return;
    const t = window.setTimeout(() => window.location.reload(), 600);
    return () => window.clearTimeout(t);
  }, [state?.ok]);

  return (
    <section className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-semibold text-slate-900">Banner đầu trang</h3>
        <p className="mt-1 text-sm text-slate-500">Thiết lập 2 dòng tiêu đề và nhãn cho 2 nút.</p>
      </div>

      <form action={formAction} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {state?.error ? (
          <p
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            role="alert"
          >
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Đã lưu.
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Dòng tiêu đề 1"
            name="title"
            defaultValue={defaultTitle}
            disabled={!canEdit || pending}
          />
          <InputField
            label="Dòng tiêu đề 2"
            name="subtitle"
            defaultValue={defaultSubtitle}
            disabled={!canEdit || pending}
          />
          <InputField
            label="Nút 1"
            name="applyLabel"
            defaultValue={defaultApplyLabel}
            disabled={!canEdit || pending}
          />
          <InputField
            label="Nút 2"
            name="lookupLabel"
            defaultValue={defaultLookupLabel}
            disabled={!canEdit || pending}
          />
        </div>

        <div className="mt-5 flex items-center justify-end">
          <Button
            type="submit"
            disabled={!canEdit || pending}
            className="h-9 bg-(--portal-primary) px-4 text-white hover:bg-(--portal-primary-hover)"
          >
            {pending ? "Đang lưu…" : "Lưu banner"}
          </Button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Danh mục cho 2 nút</h3>
            <p className="mt-1 text-sm text-slate-500">Mỗi nút có nhóm/mục riêng.</p>
          </div>

          <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => setTab("apply")}
              className={[
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition sm:flex-none",
                tab === "apply" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              Nút 1 · Nộp hồ sơ
            </button>
            <button
              type="button"
              onClick={() => setTab("lookup")}
              className={[
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition sm:flex-none",
                tab === "lookup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
              ].join(" ")}
            >
              Nút 2 · Tra cứu
            </button>
          </div>
        </div>

        <div className="mt-5">
          {tab === "apply" ? (
            <AppMobileHomeBannerMenuPanel
              canEdit={canEdit}
              ctaKey="apply_online"
              ctaLabel={defaultApplyLabel}
              sections={applySections}
              embedded
            />
          ) : (
            <AppMobileHomeBannerMenuPanel
              canEdit={canEdit}
              ctaKey="lookup_result"
              ctaLabel={defaultLookupLabel}
              sections={lookupSections}
              embedded
            />
          )}
        </div>
      </div>
    </section>
  );
}

