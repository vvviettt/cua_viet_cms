import type { Metadata } from "next";
import Link from "next/link";
import { NewsList } from "@/components/news/news-list";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listNewsArticlesForCms } from "@/lib/db/news-articles";
import { sessionCanEditModule } from "@/lib/cms-module-access";

export const metadata: Metadata = {
  title: "Tin tức",
  description: "Quản lý tin tức và thông báo — " + SITE.shortTitle,
};

export default async function TinTucPage() {
  const items = await listNewsArticlesForCms();
  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "news") : false;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
      >
        ← Bảng điều khiển
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Tin tức</h1>
         
        </div>
        {canEdit ? (
          <Link
            href="/tin-tuc/them"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover)"
          >
            Thêm tin
          </Link>
        ) : null}
      </header>

      <section className="mt-8">
        <NewsList items={items} canEdit={canEdit} />
      </section>
    </div>
  );
}
