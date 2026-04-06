import type { WorkScheduleRecord } from "@/lib/work-schedules/types";
import { weekValueToLabel } from "@/lib/work-schedules/store";

type Props = {
  schedules: WorkScheduleRecord[];
};

export function ScheduleList({ schedules }: Props) {
  if (schedules.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
        Chưa có lịch làm việc nào. Dùng form phía trên để thêm theo từng tuần.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--portal-border)] bg-white shadow-sm">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--portal-border)] bg-[var(--portal-surface)] text-xs font-semibold uppercase tracking-wide text-zinc-600">
            <th className="px-4 py-3">Tuần</th>
            <th className="px-4 py-3">Tiêu đề</th>
            <th className="px-4 py-3">File gốc</th>
            <th className="px-4 py-3">Cập nhật</th>
            <th className="px-4 py-3 text-right">Tệp PDF</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((row) => {
            const href = `/uploads/lich-lam-viec/${encodeURIComponent(row.fileName)}`;
            const updated = new Date(row.updatedAt);
            return (
              <tr key={row.id} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/80">
                <td className="px-4 py-3 font-medium text-zinc-900">{weekValueToLabel(row.weekValue)}</td>
                <td className="max-w-[14rem] truncate px-4 py-3 text-zinc-700" title={row.title}>
                  {row.title}
                </td>
                <td className="max-w-[12rem] truncate px-4 py-3 text-zinc-600" title={row.originalName}>
                  {row.originalName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-600">
                  {updated.toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex font-medium text-[var(--portal-primary)] underline-offset-2 hover:underline"
                  >
                    Mở PDF
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
