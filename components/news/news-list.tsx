import Image from "next/image";
import Link from "next/link";
import type { NewsArticleListRow } from "@/lib/db/news-articles";
import { uploadsPublicHref } from "@/lib/uploads/public-url";

function authorLabel(row: NewsArticleListRow): string {
  const n = row.authorFullName?.trim();
  return n || row.authorEmail;
}

type Props = {
  items: NewsArticleListRow[];
  canEdit: boolean;
};

export function NewsList({ items, canEdit }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
        Chưa có tin tức nào.
        {canEdit ? (
          <>
            {" "}
            <Link href="/tin-tuc/them" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
              Thêm mới
            </Link>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <ul className="flex list-none flex-col gap-3 p-0">
      {items.map((row) => (
        <li key={row.id}>
          <div
            className={`overflow-hidden rounded-xl border border-(--portal-border) bg-white shadow-sm ${
              !row.isVisible ? "opacity-75" : ""
            }`}
          >
            <div className="flex flex-col sm:flex-row">
              <div className="relative h-40 shrink-0 bg-zinc-100 sm:h-auto sm:w-44">
                <Image
                  src={uploadsPublicHref(row.bannerRelativePath)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 11rem"
                  unoptimized
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-900">{row.title}</h2>
                    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900">
                      {row.categoryTitle}
                    </span>
                    {!row.isVisible ? (
                      <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">
                        Đang ẩn
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {new Date(row.createdAt).toLocaleString("vi-VN")} — {authorLabel(row)}
                  </p>
                </div>
                {canEdit ? (
                  <Link
                    href={`/tin-tuc/${row.id}/chinh-sua`}
                    className="w-fit rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                  >
                    Chỉnh sửa
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
