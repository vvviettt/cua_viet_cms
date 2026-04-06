import type { Metadata } from "next";
import Link from "next/link";
import { FeedbackList } from "@/components/feedback/feedback-list";
import { FeedbackListPagination } from "@/components/feedback/feedback-list-pagination";
import { FeedbackSearchForm } from "@/components/feedback/feedback-search-form";
import { SITE } from "@/lib/constants";
import {
  CITIZEN_FEEDBACK_PAGE_SIZE,
  listCitizenFeedbackPaginated,
} from "@/lib/db/citizen-feedback";

export const metadata: Metadata = {
  title: "Phản ánh, kiến nghị",
  description: "Theo dõi phản ánh, kiến nghị gửi qua ứng dụng — " + SITE.shortTitle,
};

export default async function PhanAnhKienNghiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const sp = await searchParams;
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const query = String(qRaw ?? "");
  const requestedPage = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);

  const { items, total, page, pageSize } = await listCitizenFeedbackPaginated({
    page: requestedPage,
    pageSize: CITIZEN_FEEDBACK_PAGE_SIZE,
    query,
  });
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
      >
        ← Bảng điều khiển
      </Link>

      <header className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Phản ánh, kiến nghị
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Người dân gửi qua ứng dụng; tại đây bạn theo dõi danh sách và cập nhật trạng thái xử lý.
        </p>
      </header>

      <section className="mt-8 space-y-6">
        <FeedbackSearchForm defaultQuery={query} />
        <FeedbackList items={items} isFiltered={query.trim().length > 0} />
        <FeedbackListPagination
          basePath="/phan-anh-kien-nghi"
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          searchQuery={query}
        />
      </section>
    </div>
  );
}
