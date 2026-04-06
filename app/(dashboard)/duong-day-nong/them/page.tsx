import type { Metadata } from "next";
import Link from "next/link";
import { CreateHotlineForm } from "@/components/hotlines/create-hotline-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Thêm đường dây nóng",
  description: "Thêm số điện thoại dịch vụ công — " + SITE.shortTitle,
};

export default async function ThemDuongDayNongPage() {
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

      <div className="mt-10">
        <CreateHotlineForm canEdit={canEdit} redirectOnSuccessHref="/duong-day-nong" />
      </div>
    </div>
  );
}
