import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppItemForm } from "@/components/app-mobile/app-item-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { findAppMobileSectionById } from "@/lib/db/app-mobile-config";
import { canEditContent } from "@/lib/roles";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Thêm mục menu app",
  description: SITE.shortTitle,
};

export default async function ThemMucMenuPage({ params }: Props) {
  const { id: sectionId } = await params;
  const sec = await findAppMobileSectionById(sectionId);
  if (!sec) notFound();

  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="text-sm">
        <Link
          href="/cau-hinh-app?tab=menu"
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Cấu hình app
        </Link>
      </div>
      <header className="mt-6">
        <h1 className="text-2xl font-bold text-zinc-900">Thêm mục — {sec.title}</h1>
      </header>
      <section className="mt-6 rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <AppItemForm mode="create" canEdit={canEdit} sectionId={sec.id} />
      </section>
    </div>
  );
}
