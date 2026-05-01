"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, ChevronUp, GripVertical, Inbox, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteAppMobileHomeBannerSectionFormAction,
  moveAppMobileHomeBannerSectionServer,
  setAppMobileHomeBannerSectionActiveServer,
} from "@/app/actions/app-mobile-config";
import type { AppMobileListHomeBannerSection } from "./app-mobile-config-types";
import { Button } from "@/components/ui/button";

type Props = {
  canEdit: boolean;
  ctaKey: "apply_online" | "lookup_result";
  ctaLabel: string;
  sections: AppMobileListHomeBannerSection[];
  embedded?: boolean;
};

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition",
        checked ? "border-(--portal-primary) bg-(--portal-primary)" : "border-zinc-200 bg-zinc-200/70",
        disabled ? "opacity-50" : "hover:brightness-[0.98]",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--portal-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-block size-4 rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-4" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function KindBadge({ kind, routeId }: { kind: "native" | "webview" | "file"; routeId?: string | null }) {
  if (kind === "native") {
    return (
      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800">
        Native{routeId ? <span className="ml-1 text-sky-700/80">· {routeId}</span> : null}
      </span>
    );
  }
  if (kind === "file") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900">
        Tệp
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
      Webview
    </span>
  );
}

export function AppMobileHomeBannerMenuPanel({
  canEdit,
  ctaKey,
  ctaLabel,
  sections,
  embedded = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  const base = `/cau-hinh-app/banner-cta/${ctaKey}`;

  return (
    <section
      className={
        embedded ? "rounded-xl border-0 bg-transparent p-0 shadow-none" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            Nhóm danh mục · <span className="inline-block max-w-full truncate align-bottom font-semibold text-slate-900">{ctaLabel}</span>
          </h2>
          {!embedded ? (
            <p className="mt-1 text-sm text-slate-500">Quản trị nhóm/mục riêng cho nút này.</p>
          ) : null}
        </div>

        {canEdit ? (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`${base}/nhom/them`}>
              <Plus className="mr-1.5 size-4" />
              Thêm nhóm
            </Link>
          </Button>
        ) : null}
      </div>

      {sections.length === 0 ? (
        <div
          className={[
            "mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center",
            embedded ? "sm:px-6" : "",
          ].join(" ")}
        >
          <Inbox className="mx-auto size-6 text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-700">Chưa có nhóm</p>
          {canEdit ? (
            <Button asChild variant="ghost" size="sm" className="mt-2">
              <Link href={`${base}/nhom/them`}>Thêm nhóm ngay</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className={embedded ? "mt-4" : "mt-6"}>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
              <div>Nhóm</div>
              <div className="text-right">Thao tác</div>
            </div>

            <ul className="divide-y divide-slate-200 p-0">
          {sections.map((sec, secIdx) => (
            <li key={sec.id} className="px-4 py-3">
              <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <GripVertical className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
                    <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900">{sec.title}</h3>
                    <KindBadge kind={sec.kind} routeId={sec.routeId} />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <ToggleSwitch
                    checked={sec.isActive}
                    disabled={!canEdit || pending}
                    onChange={(next) => run(() => setAppMobileHomeBannerSectionActiveServer(sec.id, next))}
                    label="Hiển thị nhóm"
                  />

                  {canEdit ? (
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        disabled={pending || secIdx <= 0}
                        onClick={() => run(() => moveAppMobileHomeBannerSectionServer(sec.id, ctaKey, "up"))}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Lên trên"
                        aria-label="Lên trên"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={pending || secIdx >= sections.length - 1}
                        onClick={() => run(() => moveAppMobileHomeBannerSectionServer(sec.id, ctaKey, "down"))}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Xuống dưới"
                        aria-label="Xuống dưới"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                  ) : null}

                  {canEdit ? (
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon-sm" title="Sửa" aria-label="Sửa">
                        <Link href={`${base}/nhom/${sec.id}/chinh-sua`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <form action={deleteAppMobileHomeBannerSectionFormAction}>
                        <input type="hidden" name="sectionId" value={sec.id} />
                        <Button variant="destructive" size="icon-sm" type="submit" title="Xóa" aria-label="Xóa">
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

