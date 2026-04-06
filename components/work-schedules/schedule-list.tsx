import Link from "next/link";
import { scheduleEditQueryString } from "@/lib/work-schedules/edit-prefill";
import type { WorkScheduleRecord } from "@/lib/work-schedules/types";

type Props = {
  schedules: WorkScheduleRecord[];
};

const capNhatPath = "/lich-lam-viec/cap-nhat";

function formatUpdatedAt(iso: string): string {
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

function pdfHref(row: WorkScheduleRecord): string {
  return `/uploads/lich-lam-viec/${encodeURIComponent(row.fileName)}`;
}

export function ScheduleList({ schedules }: Props) {
  if (schedules.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
        Chưa có lịch nào. Dùng mục <strong>Tạo / cập nhật lịch</strong> để thêm theo loại, kiểu thời gian và kỳ.
      </p>
    );
  }

  return (
    <ul className="flex w-full list-none flex-col gap-4 p-0">
      {schedules.map((row) => {
        const editHref = `${capNhatPath}?${scheduleEditQueryString(row)}`;
        return (
          <li key={row.id} className="w-full">
            <div className="flex w-full flex-col gap-3 rounded-xl border border-[var(--portal-border)] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <Link
                href={editHref}
                className="min-w-0 flex-1 rounded-lg outline-offset-2 transition hover:bg-zinc-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--portal-primary)]"
              >
                <h3 className="text-base font-semibold leading-snug text-zinc-900 line-clamp-3">{row.title}</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Cập nhật lúc{" "}
                  <time dateTime={row.updatedAt} className="text-zinc-600">
                    {formatUpdatedAt(row.updatedAt)}
                  </time>
                </p>
              </Link>
              <a
                href={pdfHref(row)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-[var(--portal-primary)] hover:text-[var(--portal-primary)] sm:self-stretch"
              >
                Xem
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
