import Link from "next/link";
import type { ReactNode } from "react";

import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";

type Props = {
  title: string;
  description?: string;
  /** Nội dung đặt cạnh tiêu đề (ví dụ bật/tắt hiển thị). */
  titleAfter?: ReactNode;
  children: ReactNode;
  /** Trang cấu hình rộng hơn (ví dụ Trang chủ app). */
  wide?: boolean;
};

export function AppMobileCauHinhPageShell({ title, description, titleAfter, children, wide = false }: Props) {
  return (
    <div className={`mx-auto w-full flex-1 px-4 py-10 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Link
          href={appMobileCauHinhPaths.hub}
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Cấu hình app
        </Link>
        <Link href="/" className="text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
          Bảng điều khiển
        </Link>
      </div>

      <header className="mt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">{title}</h1>
            {description ? <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">{description}</p> : null}
          </div>
          {titleAfter ? <div className="shrink-0">{titleAfter}</div> : null}
        </div>
      </header>

      <div className="mt-8">{children}</div>
    </div>
  );
}
