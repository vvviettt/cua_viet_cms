"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ellipsis, GripVertical, ImageIcon, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
  deleteAppMobileBannerFormAction,
  moveAppMobileBannerServer,
  setAppMobileBannerActiveServer,
} from "@/app/actions/app-mobile-config";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { AppMobileListBanner } from "./app-mobile-config-types";

type Props = {
  canEdit: boolean;
  banners: AppMobileListBanner[];
  title: string;
  placement: "top" | "after_section_2";
  /** Trang danh sách banner (quay lại sau xóa / liên kết chỉnh sửa). */
  listHref?: string;
  onAddBannerClick?: () => void;
  /** Ẩn nút "Thêm banner" trên header (khi nút thêm đặt bên ngoài panel). */
  hideAddButton?: boolean;
  /** Nền nhẹ hơn khi nằm trong thẻ lớn (trang Trang chủ). */
  embedded?: boolean;
};

export function AppMobileBannerPanel({
  canEdit,
  banners,
  onAddBannerClick,
  title,
  placement,
  listHref = appMobileCauHinhPaths.trangChu,
  hideAddButton = false,
  embedded = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  const bannerIndexById = useMemo(() => {
    const m = new Map<string, number>();
    banners.forEach((b, idx) => m.set(b.id, idx));
    return m;
  }, [banners]);

  const moveBannerToIndex = (bannerId: string, toIndex: number) => {
    const fromIndex = bannerIndexById.get(bannerId);
    if (fromIndex == null) return;
    if (toIndex === fromIndex) return;
    const delta = toIndex - fromIndex;
    const steps = Math.min(Math.abs(delta), banners.length - 1);

    run(async () => {
      for (let i = 0; i < steps; i += 1) {
        await moveAppMobileBannerServer(bannerId, placement, delta > 0 ? "down" : "up");
      }
    });
  };

  return (
    <section
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        </div>
        {canEdit && !hideAddButton ? (
          <button
            type="button"
            onClick={onAddBannerClick}
            className="shrink-0 rounded-lg bg-(--portal-primary) px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover)"
          >
            Thêm ảnh
          </button>
        ) : null}
      </div>

      {banners.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
          Chưa có banner tùy chỉnh.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {banners.map((b, idx) => (
              <li
                key={b.id}
                draggable={canEdit && !pending}
                onDragStart={(e) => {
                  if (!canEdit || pending) return;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", b.id);
                  setDraggingId(b.id);
                }}
                onDragEnter={() => {
                  if (!canEdit || pending) return;
                  setDragOverId(b.id);
                }}
                onDragOver={(e) => {
                  if (!canEdit || pending) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  if (!canEdit || pending) return;
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData("text/plain");
                  const toIndex = bannerIndexById.get(b.id);
                  if (!draggedId || toIndex == null) return;
                  moveBannerToIndex(draggedId, toIndex);
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setDragOverId(null);
                }}
                className={[
                  "group relative",
                  "grid gap-3 px-4 py-3 sm:px-5 sm:py-4",
                  "sm:grid-cols-[auto_184px_1fr_auto]",
                  "sm:items-center",
                  "transition",
                  draggingId === b.id ? "bg-zinc-50" : "bg-white hover:bg-zinc-50/60",
                  dragOverId === b.id && draggingId && draggingId !== b.id ? "ring-1 ring-(--portal-primary)/30" : "",
                  !b.isActive ? "opacity-70" : "",
                ].join(" ")}
              >
                <div className="hidden sm:flex">
                  {canEdit ? (
                    <button
                      type="button"
                      disabled={pending}
                      title="Kéo để sắp xếp"
                      aria-label="Kéo để sắp xếp"
                      onClick={() => undefined}
                      className="cursor-grab rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 shadow-sm transition hover:bg-zinc-50 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <GripVertical className="size-4" aria-hidden />
                    </button>
                  ) : (
                    <span className="w-10" />
                  )}
                </div>

                <div className="relative aspect-video w-full max-w-[184px] overflow-hidden rounded-xl bg-zinc-200">
                  <Image src={b.previewSrc} alt="" fill className="object-cover" sizes="184px" unoptimized />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900" title={b.fileName}>
                    {b.fileName}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
                      <input
                        type="checkbox"
                        checked={b.isActive}
                        disabled={!canEdit || pending}
                        onChange={(e) => run(() => setAppMobileBannerActiveServer(b.id, e.target.checked))}
                        className="size-4 rounded border-zinc-300 text-(--portal-primary)"
                      />
                      <span>Hiển thị</span>
                    </label>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                      Thứ tự: {idx + 1}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  {canEdit ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={pending}
                          className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100"
                          aria-label="Thao tác"
                          title="Thao tác"
                        >
                          <Ellipsis className="size-4" aria-hidden />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-56 p-1.5">
                        <a
                          href={b.previewSrc}
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
                        >
                          <ImageIcon className="size-4 text-zinc-500" aria-hidden />
                          Xem ảnh
                        </a>
                        <Link
                          href={`/cau-hinh-app/banner/${b.id}/chinh-sua`}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
                        >
                          Xem chi tiết
                        </Link>
                        <div className="my-1 h-px bg-zinc-100" />
                        <form action={deleteAppMobileBannerFormAction}>
                          <input type="hidden" name="bannerId" value={b.id} />
                          <input type="hidden" name="returnPath" value={listHref} />
                          <button
                            type="submit"
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" aria-hidden />
                            Xóa
                          </button>
                        </form>
                      </PopoverContent>
                    </Popover>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
