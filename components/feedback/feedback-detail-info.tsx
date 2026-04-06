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

type Props = { record: CitizenFeedbackRecord };

export function FeedbackDetailInfo({ record }: Props) {
  return (
    <div className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">Thông tin kiến nghị / phản ánh</h2>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900">
          {FEEDBACK_KIND_LABELS[record.kind]}
        </span>
        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800">
          {FEEDBACK_STATUS_LABELS[record.status]}
        </span>
        {record.hiddenFromApp ? (
          <span className="rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-950">
            Ẩn trên app
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug text-zinc-900 sm:text-xl">{record.title}</h3>
      <dl className="mt-3 grid gap-1 text-sm text-zinc-600">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-zinc-500">Gửi lúc</dt>
          <dd>
            <time dateTime={record.createdAt}>{formatAt(record.createdAt)}</time>
          </dd>
        </div>
        {record.updatedAt !== record.createdAt ? (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-zinc-500">Cập nhật</dt>
            <dd>
              <time dateTime={record.updatedAt}>{formatAt(record.updatedAt)}</time>
            </dd>
          </div>
        ) : null}
        
      </dl>

      <div className="mt-6 border-t border-zinc-100 pt-6">
        <h4 className="text-sm font-semibold text-zinc-800">Nội dung người dân gửi</h4>
        <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{record.content}</div>
      </div>

      <div className="mt-6 border-t border-zinc-100 pt-6">
        <h4 className="text-sm font-semibold text-zinc-800">Tài khoản người gửi</h4>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <dt className="w-28 shrink-0 text-zinc-500">Họ tên</dt>
            <dd className="font-medium text-zinc-900">{record.accountFullName}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="w-28 shrink-0 text-zinc-500">Điện thoại</dt>
            <dd className="text-zinc-800">{record.accountPhone}</dd>
          </div>
          <div className="flex flex-wrap gap-2">
            <dt className="w-28 shrink-0 text-zinc-500">Email</dt>
            <dd className="text-zinc-800">
              {record.accountEmail ? (
                <a
                  href={`mailto:${record.accountEmail}`}
                  className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
                >
                  {record.accountEmail}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </div>

      
    </div>
  );
}
