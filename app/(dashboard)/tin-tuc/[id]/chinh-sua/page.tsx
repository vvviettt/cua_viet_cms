import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditNewsForm } from "@/components/news/edit-news-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listNewsArticleCategories } from "@/lib/db/news-article-categories";
import { findNewsArticleById } from "@/lib/db/news-articles";
import { canEditContent } from "@/lib/roles";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row = await findNewsArticleById(id);
  return {
    title: row ? `Sửa: ${row.title}` : "Sửa tin",
    description: "Chỉnh sửa tin tức — " + SITE.shortTitle,
  };
}

export default async function ChinhSuaTinTucPage({ params }: Props) {
  const { id } = await params;
  const row = await findNewsArticleById(id);
  if (!row) notFound();

  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;
  const categoryRows = await listNewsArticleCategories();
  const categories = categoryRows.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link
        href="/tin-tuc"
        className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
      >
        ← Danh sách tin
      </Link>

      <header className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Chỉnh sửa tin</h1>
      </header>

      <div className="mt-8">
        <EditNewsForm row={row} canEdit={canEdit} categories={categories} />
      </div>
    </div>
  );
}
