"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteAppMobileBannerFormAction,
  moveAppMobileBannerServer,
  setAppMobileBannerActiveServer,
} from "@/app/actions/app-mobile-config";
import type { AppMobileListBanner } from "./app-mobile-config-types";
import { AppMobileOrderArrows } from "./app-mobile-order-arrows";

type Props = {
  canEdit: boolean;
  banners: AppMobileListBanner[];
  title: string;
  description: string;
  placement: "top" | "after_section_2";
  backTab: "banner" | "carousel";
  onAddBannerClick?: () => void;
};

export function AppMobileBannerPanel({
  canEdit,
  banners,
  onAddBannerClick,
  title,
  description,
  placement,
  backTab,
}: Props) {
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
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={onAddBannerClick}
            className="shrink-0 rounded-lg bg-(--portal-primary) px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover)"
          >
            Thêm banner
          </button>
        ) : null}
      </div>

      {banners.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
          Chưa có banner tùy chỉnh.
        </p>
      ) : (
        <ul className="mt-6 flex list-none flex-col gap-4 p-0">
          {banners.map((b, idx) => (
            <li
              key={b.id}
              className={`overflow-hidden rounded-xl border border-(--portal-border) bg-zinc-50/50 ${!b.isActive ? "opacity-70" : ""}`}
            >
              <div className="grid gap-4 p-4 sm:grid-cols-[auto_160px_1fr_auto] sm:items-center">
                {canEdit ? (
                  <AppMobileOrderArrows
                    disabled={pending}
                    canUp={idx > 0}
                    canDown={idx < banners.length - 1}
                    onUp={() => run(() => moveAppMobileBannerServer(b.id, placement, "up"))}
                    onDown={() => run(() => moveAppMobileBannerServer(b.id, placement, "down"))}
                  />
                ) : (
                  <span className="hidden w-8 sm:block" />
                )}
                <div className="relative aspect-video w-full max-w-[160px] overflow-hidden rounded-lg bg-zinc-200">
                  <Image src={b.previewSrc} alt="" fill className="object-cover" sizes="160px" unoptimized />
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-zinc-900">{b.fileName}</p>
                  <label className="mt-3 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={b.isActive}
                      disabled={!canEdit || pending}
                      onChange={(e) => run(() => setAppMobileBannerActiveServer(b.id, e.target.checked))}
                      className="size-4 rounded border-zinc-300 text-(--portal-primary)"
                    />
                    <span className="text-sm text-zinc-800">Hiển thị trên app</span>
                  </label>
                </div>
                <div className="flex flex-col gap-2 sm:items-end">
                  {canEdit ? (
                    <Link
                      href={`/cau-hinh-app/banner/${b.id}/chinh-sua?tab=${backTab}`}
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                    >
                      Xem / xóa
                    </Link>
                  ) : null}
                  {canEdit ? (
                    <form action={deleteAppMobileBannerFormAction}>
                      <input type="hidden" name="bannerId" value={b.id} />
                      <input type="hidden" name="backTab" value={backTab} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100"
                      >
                        Xóa
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
