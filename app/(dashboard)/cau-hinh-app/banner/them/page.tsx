import type { Metadata } from "next";
import Link from "next/link";
import { AppBannerCreateForm } from "@/components/app-mobile/app-banner-create-form";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Thêm banner app",
  description: SITE.shortTitle,
};

type Props = {
  searchParams: Promise<{ placement?: string | string[] }>;
};

export default async function ThemBannerAppPage({ searchParams }: Props) {
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;
  const sp = await searchParams;
  const raw = Array.isArray(sp.placement) ? sp.placement[0] : sp.placement;
  const placement = raw === "after_section_2" ? "after_section_2" : "top";
  const backLabel = placement === "after_section_2" ? "← Cấu hình Trang chủ (banner giữa trang)" : "← Cấu hình Trang chủ";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link
          href={appMobileCauHinhPaths.trangChu}
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          {backLabel}
        </Link>
      </div>
      <div className="mt-10">
        <AppBannerCreateForm canEdit={canEdit} placement={placement} returnTo={appMobileCauHinhPaths.trangChu} />
      </div>
    </div>
  );
}
