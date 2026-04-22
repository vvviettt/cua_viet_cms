import type { Metadata } from "next";
import Link from "next/link";
import { AppMobileCauHinhHub } from "@/components/app-mobile/app-mobile-cau-hinh-hub";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Cấu hình ứng dụng di động",
  description: "Menu trang chủ, banner và màu app — " + SITE.shortTitle,
};

export default async function CauHinhAppPage() {
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link href="/" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
          ← Bảng điều khiển
        </Link>
      </div>

      <header className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Cấu hình ứng dụng di động</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">
          Bốn mục khớp bốn tab dưới cùng trên app di động. Mỗi mục mở trang riêng với phần cấu hình tương ứng.
          {!canEdit ? " Bạn đang xem ở chế độ chỉ đọc." : null}
        </p>
      </header>

      <AppMobileCauHinhHub />
    </div>
  );
}
