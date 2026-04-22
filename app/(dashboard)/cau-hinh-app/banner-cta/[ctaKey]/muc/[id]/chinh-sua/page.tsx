import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHomeBannerItemForm } from "@/components/app-mobile/app-home-banner-item-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { findAppMobileHomeBannerItemById } from "@/lib/db/app-mobile-config";
import { findFileById } from "@/lib/db/file-records";
import { uploadsPublicHref } from "@/lib/uploads/public-url";
import { canEditContent } from "@/lib/roles";

type Props = { params: Promise<{ ctaKey: string; id: string }> };

export const metadata: Metadata = {
  title: "Sửa mục CTA",
  description: SITE.shortTitle,
};

function parseCtaKey(raw: string): "apply_online" | "lookup_result" | null {
  if (raw === "apply_online" || raw === "lookup_result") return raw;
  return null;
}

export default async function ChinhSuaMucCtaPage({ params }: Props) {
  const { ctaKey: rawKey, id } = await params;
  const ctaKey = parseCtaKey(rawKey);
  if (!ctaKey) notFound();

  const it = await findAppMobileHomeBannerItemById(id);
  if (!it) notFound();

  const session = await getSession();
  const canEdit = session ? canEditContent(session.role) : false;
  const iconFile = it.iconFileId ? await findFileById(it.iconFileId) : null;
  const iconPreview = iconFile ? uploadsPublicHref(iconFile.relativePath) : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="text-sm">
        <Link href="/cau-hinh-app/trang-chu" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
          ← Cấu hình app
        </Link>
      </div>
      <header className="mt-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sửa mục CTA — {it.label}</h1>
      </header>
      <section className="mt-6 rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <AppHomeBannerItemForm
          mode="edit"
          canEdit={canEdit}
          itemId={it.id}
          defaultKind={it.kind}
          defaultRouteId={it.routeId ?? "none"}
          defaultWebUrl={it.webUrl ?? ""}
          defaultLabel={it.label}
          defaultIconKey={it.iconKey}
          defaultIconPreviewSrc={iconPreview}
        />
      </section>
    </div>
  );
}

