import type { Metadata } from "next";
import Link from "next/link";
import { CreateNewsForm } from "@/components/news/create-news-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listNewsArticleCategories } from "@/lib/db/news-article-categories";
import { sessionCanEditModule } from "@/lib/cms-module-access";

export const metadata: Metadata = {
  title: "Thêm tin tức",
  description: "Tạo tin mới — " + SITE.shortTitle,
};

export default async function ThemTinTucPage() {
  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "news") : false;
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
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Thêm tin tức</h1>
      </header>

      <div className="mt-8">
        <CreateNewsForm canEdit={canEdit} categories={categories} />
      </div>
    </div>
  );
}
