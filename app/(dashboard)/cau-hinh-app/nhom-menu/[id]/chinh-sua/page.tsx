import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppSectionForm } from "@/components/app-mobile/app-section-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { findAppMobileSectionById } from "@/lib/db/app-mobile-config";
import { canEditContent } from "@/lib/roles";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Sửa nhóm menu app",
  description: SITE.shortTitle,
};

export default async function ChinhSuaNhomMenuPage({ params }: Props) {
  const { id } = await params;
  const sec = await findAppMobileSectionById(id);
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
        <h1 className="text-2xl font-bold text-zinc-900">Sửa nhóm menu</h1>
      </header>
      <section className="mt-6 rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <AppSectionForm
          mode="edit"
          canEdit={canEdit}
          sectionId={sec.id}
          defaultTitle={sec.title}
        />
      </section>
    </div>
  );
}
