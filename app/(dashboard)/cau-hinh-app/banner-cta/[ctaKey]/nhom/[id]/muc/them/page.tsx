import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHomeBannerItemForm } from "@/components/app-mobile/app-home-banner-item-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { findAppMobileHomeBannerSectionById } from "@/lib/db/app-mobile-config";
import { sessionCanEditModule } from "@/lib/cms-module-access";

type Props = { params: Promise<{ ctaKey: string; id: string }> };

export const metadata: Metadata = {
  title: "Thêm mục CTA",
  description: SITE.shortTitle,
};

function parseCtaKey(raw: string): "apply_online" | "lookup_result" | null {
  if (raw === "apply_online" || raw === "lookup_result") return raw;
  return null;
}

export default async function ThemMucCtaPage({ params }: Props) {
  const { ctaKey: rawKey, id: sectionId } = await params;
  const ctaKey = parseCtaKey(rawKey);
  if (!ctaKey) notFound();

  const sec = await findAppMobileHomeBannerSectionById(sectionId);
  if (!sec) notFound();

  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "app_mobile") : false;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="text-sm">
        <Link href="/cau-hinh-app/trang-chu" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
          ← Cấu hình app
        </Link>
      </div>
      <header className="mt-6">
        <h1 className="text-2xl font-bold text-zinc-900">Thêm mục CTA — {sec.title}</h1>
      </header>
      <section className="mt-6 rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <AppHomeBannerItemForm mode="create" canEdit={canEdit} sectionId={sec.id} />
      </section>
    </div>
  );
}

