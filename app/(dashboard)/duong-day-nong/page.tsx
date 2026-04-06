import type { Metadata } from "next";
import Link from "next/link";
import { HotlineList } from "@/components/hotlines/hotline-list";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listPublicHotlinesForCms } from "@/lib/db/public-hotlines";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Đường dây nóng",
  description: "Danh sách số điện thoại dịch vụ công — " + SITE.shortTitle,
};

export default async function DuongDayNongPage() {
  const items = await listPublicHotlinesForCms();
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;

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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Đường dây nóng</h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-600">
            Số điện thoại các dịch vụ công để người dân liên hệ.
          </p>
        </div>
        {canEdit ? (
          <Link
            href="/duong-day-nong/them"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover)"
          >
            Thêm số
          </Link>
        ) : null}
      </header>

      <section className="mt-8">
        <HotlineList items={items} canEdit={canEdit} />
      </section>
    </div>
  );
}
