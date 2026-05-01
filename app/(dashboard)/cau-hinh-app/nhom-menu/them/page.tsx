import type { Metadata } from "next";
import Link from "next/link";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";
import { AppSectionForm } from "@/components/app-mobile/app-section-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { sessionCanEditModule } from "@/lib/cms-module-access";

export const metadata: Metadata = {
  title: "Thêm nhóm menu app",
  description: SITE.shortTitle,
};

export default async function ThemNhomMenuPage() {
  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "app_mobile") : false;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="text-sm">
        <Link
          href={appMobileCauHinhPaths.trangChu}
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Cấu hình app
        </Link>
      </div>
      <header className="mt-6">
        <h1 className="text-2xl font-bold text-zinc-900">Thêm nhóm menu</h1>
      </header>
      <section className="mt-6 rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <AppSectionForm mode="create" canEdit={canEdit} />
      </section>
    </div>
  );
}
