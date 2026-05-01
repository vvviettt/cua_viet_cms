import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditStaffForm } from "@/components/staff/edit-staff-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { findStaffMemberById } from "@/lib/db/staff-members";
import { sessionCanEditModule } from "@/lib/cms-module-access";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const member = await findStaffMemberById(id);
  if (!member) {
    return { title: "Không tìm thấy — " + SITE.shortTitle };
  }
  return {
    title: `Chỉnh sửa — ${member.fullName}`,
    description: `Cập nhật thông tin ${member.fullName} — ${SITE.shortTitle}`,
  };
}

export default async function ChinhSuaCanBoPage({ params }: Props) {
  const { id } = await params;
  const member = await findStaffMemberById(id);
  if (!member) {
    notFound();
  }

  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "staff") : false;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link
          href="/can-bo"
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Danh sách cán bộ
        </Link>
        <span className="text-zinc-300" aria-hidden>
          ·
        </span>
        <Link href="/" className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
          Bảng điều khiển
        </Link>
      </div>

      <div className="mt-10">
        <EditStaffForm member={member} canEdit={canEdit} redirectOnSuccessHref="/can-bo" />
      </div>
    </div>
  );
}
