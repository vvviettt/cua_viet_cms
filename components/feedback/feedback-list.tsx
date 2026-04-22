import Link from "next/link";
import type { CitizenFeedbackRecord } from "@/lib/citizen-feedback/types";
import { FEEDBACK_KIND_LABELS, FEEDBACK_STATUS_LABELS } from "@/lib/citizen-feedback/types";

function formatAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusPillClass(status: CitizenFeedbackRecord["status"]): string {
  switch (status) {
    case "received":
      return "bg-sky-100 text-sky-900";
    case "processing":
      return "bg-amber-100 text-amber-950";
    case "answered":
      return "bg-emerald-100 text-emerald-900";
    case "closed":
    default:
      return "bg-zinc-200 text-zinc-800";
  }
}

type Props = {
  items: CitizenFeedbackRecord[];
  isFiltered: boolean;
};

export function FeedbackList({ items, isFiltered }: Props) {
  if (items.length === 0) {
    if (isFiltered) {
      return (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
          Không có hồ sơ khớp bộ lọc.{" "}
          <Link href="/phan-anh-kien-nghi" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
            Xóa tìm kiếm
          </Link>
        </p>
      );
    }
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
        Chưa có phản ánh hoặc kiến nghị nào. Hồ sơ sẽ xuất hiện khi người dân gửi qua ứng dụng.
      </p>
    );
  }

  return (
    <ul className="flex list-none flex-col gap-3 p-0">
      {items.map((row) => (
        <li key={row.id}>
          <Link
            href={`/phan-anh-kien-nghi/${row.id}`}
            className="block rounded-xl border border-(--portal-border) bg-white p-4 shadow-sm transition hover:border-(--portal-primary)/40 hover:bg-zinc-50/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--portal-primary)"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
                    {FEEDBACK_KIND_LABELS[row.kind]}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${statusPillClass(row.status)}`}>
                    {FEEDBACK_STATUS_LABELS[row.status]}
                  </span>
                  {row.hiddenFromApp ? (
                    <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-950">
                      Ẩn app
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-2 text-base font-semibold leading-snug text-zinc-900 line-clamp-2">{row.title}</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Người gửi: <span className="font-medium text-zinc-800">{row.accountFullName}</span>
                  <span className="text-zinc-500"> · {row.accountPhone}</span>
                </p>
              </div>
              <time dateTime={row.createdAt} className="shrink-0 text-xs text-zinc-500">
                {formatAt(row.createdAt)}
              </time>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
