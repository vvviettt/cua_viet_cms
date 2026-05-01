"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown, ChevronUp, Heart, Pencil, Trash2 } from "lucide-react";
import {
  deleteAppMobileItemFormAction,
  deleteAppMobileSectionFormAction,
  moveAppMobileItemServer,
  moveAppMobileSectionServer,
  setAppMobileItemActiveServer,
  setAppMobileItemDefaultFavoriteServer,
  setAppMobileSectionActiveServer,
} from "@/app/actions/app-mobile-config";
import type { AppMobileListSection } from "./app-mobile-config-types";

type Props = {
  canEdit: boolean;
  sections: AppMobileListSection[];
  /** Ẩn khung + tiêu đề ngoài (đã có trong layout cha). */
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
        Tệp đính kèm
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700">
      Webview
    </span>
  );
}

export function AppMobileMenuPanel({ canEdit, sections, embedded = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <section
      className={
        embedded
          ? "rounded-xl border-0 bg-transparent p-0 shadow-none"
          : "rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6"
      }
    >

      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Danh mục dịch vụ trên trang chủ</h2>
        </div>
        {canEdit ? (
          <Link
            href="/cau-hinh-app/nhom-menu/them"
            className="shrink-0 rounded-lg bg-(--portal-primary) px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover)"
          >
            Thêm nhóm
          </Link>
        ) : null}
      </div>


      {sections.length === 0 ? (
        <p
          className={`rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600 ${embedded ? "mt-0" : "mt-6"}`}
        >
          Chưa có nhóm menu. Chạy{" "}
          <code className="rounded bg-zinc-100 px-1">npm run db:seed:app-mobile</code> để nhập mặc định.
        </p>
      ) : (
        <ul className={`flex list-none flex-col gap-8 p-0 ${embedded ? "mt-2" : "mt-8"}`}>
          {sections.map((sec, secIdx) => (
            <li key={sec.id} className="rounded-xl border border-zinc-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold tracking-wide text-zinc-900 uppercase">{sec.title}</h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ToggleSwitch
                      checked={sec.isActive}
                      disabled={!canEdit || pending}
                      onChange={(next) => run(() => setAppMobileSectionActiveServer(sec.id, next))}
                      label="Hiển thị nhóm trên app"
                    />
                    <span className="text-xs text-zinc-600">Hiển thị nhóm trên app</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {canEdit ? (
                    <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
                      <button
                        type="button"
                        disabled={pending || secIdx <= 0}
                        onClick={() => run(() => moveAppMobileSectionServer(sec.id, "up"))}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Lên trên"
                        aria-label="Lên trên"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={pending || secIdx >= sections.length - 1}
                        onClick={() => run(() => moveAppMobileSectionServer(sec.id, "down"))}
                        className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="Xuống dưới"
                        aria-label="Xuống dưới"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </div>
                  ) : null}

                  {canEdit ? (
                    <Link
                      href={`/cau-hinh-app/nhom-menu/${sec.id}/chinh-sua`}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm"
                    >
                      Sửa tên nhóm
                    </Link>
                  ) : null}
                  {canEdit ? (
                    <Link
                      href={`/cau-hinh-app/nhom-menu/${sec.id}/muc/them`}
                      className="rounded-lg bg-(--portal-primary) px-3 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      Thêm mục
                    </Link>
                  ) : null}
                  {canEdit ? (
                    <form action={deleteAppMobileSectionFormAction}>
                      <input type="hidden" name="sectionId" value={sec.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
                      >
                        Xóa nhóm
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>

              {sec.items.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500">Chưa có mục trong nhóm này.</p>
              ) : (
                <ul className="mt-4 list-none divide-y divide-zinc-200/60 rounded-lg border border-zinc-200/70 bg-white p-0">
                  {sec.items.map((it, itIdx) => (
                    <li
                      key={it.id}
                      className="group flex flex-wrap items-center gap-3 px-4 py-3 text-sm transition hover:bg-zinc-50/70"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-zinc-900">{it.label}</span>
                          <KindBadge kind={it.kind} routeId={it.routeId} />
                        </div>
                      </div>

                      <div className="ml-auto flex items-center gap-2">
                        {canEdit ? (
                          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
                            <button
                              type="button"
                              disabled={pending || itIdx <= 0}
                              onClick={() => run(() => moveAppMobileItemServer(it.id, sec.id, "up"))}
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Lên trên"
                              aria-label="Lên trên"
                            >
                              <ChevronUp className="size-4" />
                            </button>
                            <button
                              type="button"
                              disabled={pending || itIdx >= sec.items.length - 1}
                              onClick={() => run(() => moveAppMobileItemServer(it.id, sec.id, "down"))}
                              className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Xuống dưới"
                              aria-label="Xuống dưới"
                            >
                              <ChevronDown className="size-4" />
                            </button>
                          </div>
                        ) : null}

                        {canEdit ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              run(() =>
                                setAppMobileItemDefaultFavoriteServer(it.id, !it.isDefaultFavorite),
                              )
                            }
                            title={it.isDefaultFavorite ? "Bỏ mặc định" : "Yêu thích mặc định"}
                            aria-label={it.isDefaultFavorite ? "Bỏ mặc định" : "Yêu thích mặc định"}
                            aria-pressed={it.isDefaultFavorite}
                            className={[
                              "inline-flex items-center justify-center rounded-md p-1.5 transition-all duration-200",
                              it.isDefaultFavorite ? "text-red-600" : "text-zinc-400",
                              pending
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer active:scale-95 hover:text-red-500",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--portal-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                            ].join(" ")}
                          >
                            <Heart className="size-5" fill={it.isDefaultFavorite ? "currentColor" : "none"} strokeWidth={1.75} />
                          </button>
                        ) : null}

                        <ToggleSwitch
                          checked={it.isActive}
                          disabled={!canEdit || pending}
                          onChange={(next) => run(() => setAppMobileItemActiveServer(it.id, next))}
                          label="Hiển thị trên app"
                        />

                        {canEdit ? (
                          <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                            <Link
                              href={`/cau-hinh-app/muc/${it.id}/chinh-sua`}
                              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-700 hover:bg-zinc-100"
                              title="Sửa"
                              aria-label="Sửa"
                            >
                              <Pencil className="size-4" />
                            </Link>
                            <form action={deleteAppMobileItemFormAction}>
                              <input type="hidden" name="itemId" value={it.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-md p-2 text-red-700 hover:bg-red-50"
                                title="Xóa"
                                aria-label="Xóa"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
