import type { Metadata } from "next";
import Link from "next/link";
import { StaffMemberCards } from "@/components/staff/staff-member-cards";
import { StaffListPagination } from "@/components/staff/staff-list-pagination";
import { StaffSearchForm } from "@/components/staff/staff-search-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { canEditContent } from "@/lib/roles";
import { STAFF_LIST_PAGE_SIZE, listStaffMembersPaginated } from "@/lib/db/staff-members";

export const metadata: Metadata = {
  title: "Cán bộ, công nhân viên",
  description: "Quản lý cán bộ, công nhân viên — " + SITE.shortTitle,
};

export default async function CanBoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}) {
  const sp = await searchParams;
  const qRaw = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const query = String(qRaw ?? "");
  const requestedPage = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);

  const { items, total, page, pageSize } = await listStaffMembersPaginated({
    page: requestedPage,
    pageSize: STAFF_LIST_PAGE_SIZE,
    query,
  });
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
      >
        ← Bảng điều khiển
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Cán bộ, công nhân viên
          </h1>
        </div>
        {canEdit ? (
          <Link
            href="/can-bo/them"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover)"
          >
            Thêm cán bộ
          </Link>
        ) : null}
      </header>

      <section className="mt-8 space-y-6">
        <StaffSearchForm defaultQuery={query} />
        <StaffMemberCards
          members={items}
          isFiltered={query.trim().length > 0}
          canEdit={canEdit}
        />
        <StaffListPagination
          basePath="/can-bo"
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
