import type { Metadata } from "next";
import Link from "next/link";
import { ScheduleList } from "@/components/work-schedules/schedule-list";
import { SchedulePagination } from "@/components/work-schedules/schedule-pagination";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { sessionCanEditModule } from "@/lib/cms-module-access";
import {
  WORK_SCHEDULE_LIST_PAGE_SIZE,
  listWorkSchedulesPaginated,
} from "@/lib/work-schedules/store";

export const metadata: Metadata = {
  title: "Quản lý lịch làm việc",
  description: "Quản lý lịch làm việc nội bộ — " + SITE.shortTitle,
};

export default async function LichLamViecPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const session = await getSession();
  const canUpload = session ? await sessionCanEditModule(session, "work_schedule") : false;
  const sp = await searchParams;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const requestedPage = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);
  const { items, total, page, pageSize } = await listWorkSchedulesPaginated(
    requestedPage,
    WORK_SCHEDULE_LIST_PAGE_SIZE,
  );
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
      >
        ← Bảng điều khiển
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Quản lý lịch làm việc
          </h1>

        </div>
        {canUpload ? (
          <Link
            href="/lich-lam-viec/cap-nhat"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--portal-primary-hover)]"
          >
            Tạo lịch
          </Link>
        ) : null}
      </div>

      <section className="mt-10">
        <div className="mt-4">
          <ScheduleList schedules={items} />
          <SchedulePagination
            basePath="/lich-lam-viec"
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
          />
        </div>
      </section>
    </div>
  );
}
