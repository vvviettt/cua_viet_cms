import type { Metadata } from "next";
import Link from "next/link";
import { CreateScheduleForm } from "@/components/work-schedules/create-schedule-form";
import { ScheduleList } from "@/components/work-schedules/schedule-list";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { canEditContent } from "@/lib/roles";
import { listWorkSchedules } from "@/lib/work-schedules/store";

export const metadata: Metadata = {
  title: "Quản lý lịch làm việc",
  description: "Quản lý lịch làm việc nội bộ — " + SITE.shortTitle,
};

export default async function LichLamViecPage() {
  const session = await getSession();
  const canUpload = session ? canEditContent(session.role) : false;
  const schedules = await listWorkSchedules();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--portal-primary)] underline-offset-2 hover:underline"
      >
        ← Bảng điều khiển
      </Link>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
        Quản lý lịch làm việc
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Danh sách theo từng tuần; mỗi tuần một bản PDF. Tải lên tuần đã tồn tại sẽ thay thế file cũ.
      </p>

      <div className="mt-10 flex flex-col gap-10">
        <CreateScheduleForm canUpload={canUpload} />
        <section>
          <h2 className="text-lg font-semibold text-zinc-900">Danh sách theo tuần</h2>
          <p className="mt-1 text-sm text-zinc-600">Sắp xếp: tuần mới nhất trước.</p>
          <div className="mt-4 overflow-x-auto">
            <ScheduleList schedules={schedules} />
          </div>
        </section>
      </div>
    </div>
  );
}
