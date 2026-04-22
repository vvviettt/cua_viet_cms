import Link from "next/link";
import { Bell, Bot, Home, Settings } from "lucide-react";

import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";

const items = [
  {
    href: appMobileCauHinhPaths.trangChu,
    title: "Trang chủ",
    description: "Màu & tiêu đề hero, banner đầu trang và giữa trang, danh mục dịch vụ, và tab Trang chủ trên thanh điều hướng.",
    Icon: Home,
  },
  {
    href: appMobileCauHinhPaths.troLyAo,
    title: "Trợ lý ảo",
    description: "Hiển thị và thứ tự tab Trợ lý ảo trên thanh điều hướng dưới app.",
    Icon: Bot,
  },
  {
    href: appMobileCauHinhPaths.thongBao,
    title: "Thông báo",
    description: "Hiển thị và thứ tự tab Thông báo trên thanh điều hướng dưới app.",
    Icon: Bell,
  },
  {
    href: appMobileCauHinhPaths.caiDat,
    title: "Cài đặt",
    description: "Hiển thị và thứ tự tab Cài đặt trên thanh điều hướng dưới app.",
    Icon: Settings,
  },
] as const;

export function AppMobileCauHinhHub() {
  return (
    <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2">
      {items.map(({ href, title, description, Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className="flex h-full flex-col gap-3 rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm transition hover:border-(--portal-primary)/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--portal-primary)"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-(--portal-primary)/10 text-(--portal-primary)">
              <Icon className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-base font-semibold text-zinc-900">{title}</span>
              <span className="mt-1 block text-sm leading-snug text-zinc-600">{description}</span>
            </span>
            <span className="text-sm font-medium text-(--portal-primary)">Mở cấu hình →</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
