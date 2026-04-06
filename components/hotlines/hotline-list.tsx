import Link from "next/link";
import type { PublicHotlineRow } from "@/lib/db/public-hotlines";

function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

type Props = {
  items: PublicHotlineRow[];
  canEdit: boolean;
};

export function HotlineList({ items, canEdit }: Props) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
        Chưa có số đường dây nóng nào.
        {canEdit ? (
          <>
            {" "}
            <Link href="/duong-day-nong/them" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
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
            className={`rounded-xl border border-(--portal-border) bg-white p-4 shadow-sm sm:p-5 ${
              !row.isActive ? "opacity-75" : ""
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-zinc-900">{row.serviceName}</h2>
                  {!row.isActive ? (
                    <span className="rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700">
                      Ngưng hiển thị
                    </span>
                  ) : null}
                </div>
                <p className="mt-2">
                  <a
                    href={telHref(row.phone)}
                    className="text-lg font-semibold text-(--portal-primary) underline-offset-2 hover:underline"
                  >
                    {row.phone}
                  </a>
                </p>
                {row.note ? (
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 whitespace-pre-wrap">{row.note}</p>
                ) : null}
                <p className="mt-2 text-xs text-zinc-400">Thứ tự hiển thị: {row.sortOrder}</p>
              </div>
              {canEdit ? (
                <Link
                  href={`/duong-day-nong/${row.id}/chinh-sua`}
                  className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                >
                  Chỉnh sửa
                </Link>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
