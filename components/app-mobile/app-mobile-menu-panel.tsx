"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteAppMobileItemFormAction,
  deleteAppMobileSectionFormAction,
  moveAppMobileItemServer,
  moveAppMobileSectionServer,
  setAppMobileItemActiveServer,
  setAppMobileSectionActiveServer,
} from "@/app/actions/app-mobile-config";
import type { AppMobileListSection } from "./app-mobile-config-types";
import { AppMobileOrderArrows } from "./app-mobile-order-arrows";

type Props = {
  canEdit: boolean;
  sections: AppMobileListSection[];
};

export function AppMobileMenuPanel({ canEdit, sections }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Nhóm & mục menu trang chủ</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sắp xếp nhóm và từng mục bằng mũi tên. Tick để bật/tắt trên app.
          </p>
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
        <p className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
          Chưa có nhóm menu. Chạy{" "}
          <code className="rounded bg-zinc-100 px-1">npm run db:seed:app-mobile</code> để nhập mặc định.
        </p>
      ) : (
        <ul className="mt-8 flex list-none flex-col gap-8 p-0">
          {sections.map((sec, secIdx) => (
            <li key={sec.id} className="rounded-xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                {canEdit ? (
                  <AppMobileOrderArrows
                    disabled={pending}
                    canUp={secIdx > 0}
                    canDown={secIdx < sections.length - 1}
                    onUp={() => run(() => moveAppMobileSectionServer(sec.id, "up"))}
                    onDown={() => run(() => moveAppMobileSectionServer(sec.id, "down"))}
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-zinc-900">{sec.title}</h3>
                  <label className="mt-2 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sec.isActive}
                      disabled={!canEdit || pending}
                      onChange={(e) =>
                        run(() => setAppMobileSectionActiveServer(sec.id, e.target.checked))
                      }
                      className="size-4 rounded border-zinc-300 text-(--portal-primary)"
                    />
                    <span className="text-sm text-zinc-800">Hiển thị nhóm trên app</span>
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
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
                <ul className="mt-4 flex list-none flex-col gap-2 border-t border-zinc-200/80 p-0 pt-4">
                  {sec.items.map((it, itIdx) => (
                    <li
                      key={it.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                    >
                      {canEdit ? (
                        <AppMobileOrderArrows
                          disabled={pending}
                          canUp={itIdx > 0}
                          canDown={itIdx < sec.items.length - 1}
                          onUp={() => run(() => moveAppMobileItemServer(it.id, sec.id, "up"))}
                          onDown={() => run(() => moveAppMobileItemServer(it.id, sec.id, "down"))}
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-zinc-900">{it.label}</span>
                        <span className="ml-2 text-xs text-zinc-500">
                          {it.kind === "native" ? `native:${it.routeId ?? ""}` : "webview"}
                        </span>
                      </div>
                      <label className="flex shrink-0 cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={it.isActive}
                          disabled={!canEdit || pending}
                          onChange={(e) =>
                            run(() => setAppMobileItemActiveServer(it.id, e.target.checked))
                          }
                          className="size-4 rounded border-zinc-300 text-(--portal-primary)"
                        />
                        <span className="text-xs text-zinc-700">Hiện trên app</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {canEdit ? (
                          <Link
                            href={`/cau-hinh-app/muc/${it.id}/chinh-sua`}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-800"
                          >
                            Sửa
                          </Link>
                        ) : null}
                        {canEdit ? (
                          <form action={deleteAppMobileItemFormAction}>
                            <input type="hidden" name="itemId" value={it.id} />
                            <button type="submit" className="text-xs font-medium text-red-700 underline">
                              Xóa
                            </button>
                          </form>
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
