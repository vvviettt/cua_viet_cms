import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { canManageUsers } from "@/lib/roles";
import {
  CITIZEN_ACCOUNT_LIST_PAGE_SIZE,
  listCitizenAccountsPaginated,
} from "@/lib/db/citizen-accounts";
import { CitizenAccountsTable } from "@/components/citizen-accounts/citizen-accounts-table";

export const metadata: Metadata = {
  title: "Tài khoản ứng dụng",
  description: "Quản lý tài khoản người dân trên ứng dụng — " + SITE.shortTitle,
};

export default async function NguoiDungPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const sp = await searchParams;
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const requestedPage = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);

  const session = await getSession();
  const canManage = session != null && canManageUsers(session.isAdmin);
  const accountPage = await listCitizenAccountsPaginated({
    page: requestedPage,
    pageSize: CITIZEN_ACCOUNT_LIST_PAGE_SIZE,
  });
  const totalPages =
    accountPage.total === 0 ? 0 : Math.ceil(accountPage.total / accountPage.pageSize);

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
          Tài khoản ứng dụng
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Danh sách tài khoản người dân đăng nhập app.
        </p>
      </header>

      <CitizenAccountsTable
        items={accountPage.items}
        canManage={canManage}
        pagination={{
          basePath: "/nguoi-dung",
          currentPage: accountPage.page,
          totalPages,
          totalItems: accountPage.total,
          pageSize: accountPage.pageSize,
        }}
      />
    </div>
  );
}
