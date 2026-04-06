import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cán bộ, công nhân viên",
  description: "Quản lý cán bộ, công nhân viên — " + SITE.shortTitle,
};

export default function CanBoPage() {
  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-[var(--portal-primary)] underline-offset-2 hover:underline"
      >
        ← Bảng điều khiển
      </Link>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
        Cán bộ, công nhân viên
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Module dùng để quản lý danh sách và thông tin cán bộ, công chức, người lao động phục vụ
        công tác nội bộ. Chức năng chi tiết sẽ được bổ sung theo yêu cầu nghiệp vụ.
      </p>
    </div>
  );
}
