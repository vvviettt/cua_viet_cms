import type { Metadata } from "next";
import Link from "next/link";
import { CreateScheduleForm } from "@/components/work-schedules/create-schedule-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listActiveWorkScheduleTypes } from "@/lib/db/work-schedule-types";
import { parseScheduleEditPrefill } from "@/lib/work-schedules/edit-prefill";
import { findBySchedulePeriod } from "@/lib/work-schedules/store";
import { sessionCanEditModule } from "@/lib/cms-module-access";

export const metadata: Metadata = {
  title: "Tạo / cập nhật lịch làm việc",
  description: "Tải lên PDF lịch làm việc theo tuần — " + SITE.shortTitle,
};

export default async function CapNhatLichLamViecPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  const canUpload = session ? await sessionCanEditModule(session, "work_schedule") : false;
  const scheduleTypes = await listActiveWorkScheduleTypes();
  const sp = await searchParams;
  const prefill = parseScheduleEditPrefill(sp);
  const formKey = prefill
    ? `${prefill.typeId}-${prefill.periodKind}-${prefill.periodValue}`
    : "new";

  const existingRow = prefill
    ? await findBySchedulePeriod(prefill.typeId, prefill.periodKind, prefill.periodValue)
    : null;
  const existingUploadedFile = existingRow
    ? { fileName: existingRow.fileName, originalName: existingRow.originalName }
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link
          href="/lich-lam-viec"
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Danh sách lịch làm việc
        </Link>
        <span className="text-zinc-300" aria-hidden>
          ·
        </span>
        <Link
          href="/"
          className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline"
        >
          Bảng điều khiển
        </Link>
      </div>



      <div className="mt-10">
        <CreateScheduleForm
          key={formKey}
          canUpload={canUpload}
          scheduleTypes={scheduleTypes.map((t) => ({ id: t.id, label: t.label }))}
          redirectOnSuccessHref="/lich-lam-viec"
          prefillFromList={prefill}
          existingUploadedFile={existingUploadedFile}
          existingWorkScheduleId={existingRow?.id ?? null}
        />
      </div>
    </div>
  );
}
