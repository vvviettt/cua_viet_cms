import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackDetailInfo } from "@/components/feedback/feedback-detail-info";
import { StaffReplyForm } from "@/components/feedback/staff-reply-form";
import { UpdateFeedbackForm } from "@/components/feedback/update-feedback-form";
import { getSession } from "@/lib/auth";
import { canEditCmsModule } from "@/lib/cms-module-access";
import { SITE } from "@/lib/constants";
import { findCitizenFeedbackById } from "@/lib/db/citizen-feedback";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row = await findCitizenFeedbackById(id);
  if (!row) return { title: "Không tìm thấy — " + SITE.shortTitle };
  return {
    title: row.title.slice(0, 60) + (row.title.length > 60 ? "…" : ""),
    description: "Chi tiết phản ánh, kiến nghị — " + SITE.shortTitle,
  };
}

export default async function ChiTietPhanAnhPage({ params }: Props) {
  const { id } = await params;
  const record = await findCitizenFeedbackById(id);
  if (!record) notFound();

  const session = await getSession();
  const canEdit =
    session != null && (await canEditCmsModule(session, "citizen_feedback"));

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link
          href="/phan-anh-kien-nghi"
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Danh sách
        </Link>
        <span className="text-zinc-300" aria-hidden>
          ·
        </span>
        <Link href="/" className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
          Bảng điều khiển
        </Link>
      </div>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Chi tiết hồ sơ</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:items-start">
        <FeedbackDetailInfo record={record} />
        <StaffReplyForm record={record} canEdit={canEdit} />
      </div>

      <div className="mt-6">
        <UpdateFeedbackForm record={record} canEdit={canEdit} />
      </div>
    </div>
  );
}
