import type { Metadata } from "next";
import Link from "next/link";
import { AppBannerCreateForm } from "@/components/app-mobile/app-banner-create-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { canEditContent } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Thêm banner app",
  description: SITE.shortTitle,
};

export default async function ThemBannerAppPage() {
  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link
          href="/cau-hinh-app?tab=banner"
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Cấu hình app
        </Link>
      </div>
      <div className="mt-10">
        <AppBannerCreateForm canEdit={canEdit} />
      </div>
    </div>
  );
}
