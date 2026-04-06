import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditHotlineForm } from "@/components/hotlines/edit-hotline-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { findPublicHotlineById } from "@/lib/db/public-hotlines";
import { canEditContent } from "@/lib/roles";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row = await findPublicHotlineById(id);
  if (!row) return { title: "Không tìm thấy — " + SITE.shortTitle };
  return {
    title: `Sửa: ${row.serviceName.slice(0, 40)}`,
    description: "Chỉnh sửa đường dây nóng — " + SITE.shortTitle,
  };
}

export default async function ChinhSuaDuongDayNongPage({ params }: Props) {
  const { id } = await params;
  const row = await findPublicHotlineById(id);
  if (!row) notFound();

  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link
          href="/duong-day-nong"
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Danh sách đường dây nóng
        </Link>
        <span className="text-zinc-300" aria-hidden>
          ·
        </span>
        <Link href="/" className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
          Bảng điều khiển
        </Link>
      </div>

      <h1 className="mt-8 text-2xl font-bold tracking-tight text-zinc-900">Chỉnh sửa</h1>
      <p className="mt-1 text-sm text-zinc-600">{row.serviceName}</p>

      <div className="mt-8">
        <EditHotlineForm row={row} canEdit={canEdit} />
      </div>
    </div>
  );
}
