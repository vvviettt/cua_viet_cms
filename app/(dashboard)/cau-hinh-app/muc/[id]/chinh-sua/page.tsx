import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppItemForm } from "@/components/app-mobile/app-item-form";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { findAppMobileItemById } from "@/lib/db/app-mobile-config";
import { findFileById } from "@/lib/db/file-records";
import { uploadsPublicHref } from "@/lib/uploads/public-url";
import { sessionCanEditModule } from "@/lib/cms-module-access";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Sửa mục menu app",
  description: SITE.shortTitle,
};

export default async function ChinhSuaMucMenuPage({ params }: Props) {
  const { id } = await params;
  const it = await findAppMobileItemById(id);
  if (!it) notFound();

  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "app_mobile") : false;
  const iconFile = it.iconFileId ? await findFileById(it.iconFileId) : null;
  const iconPreview = iconFile ? uploadsPublicHref(iconFile.relativePath) : undefined;
  const docFile = it.documentFileId ? await findFileById(it.documentFileId) : null;
  const documentPreview = docFile ? uploadsPublicHref(docFile.relativePath) : undefined;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="text-sm">
        <Link
          href="/cau-hinh-app/trang-chu"
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Cấu hình app
        </Link>
      </div>
      <header className="mt-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sửa mục — {it.label}</h1>
      </header>
      <section className="mt-6 rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <AppItemForm
          mode="edit"
          canEdit={canEdit}
          itemId={it.id}
          defaultKind={it.kind}
          defaultRouteId={it.routeId ?? "none"}
          defaultWebUrl={it.webUrl ?? ""}
          defaultLabel={it.label}
          defaultArticleTitle={it.kind === "article" ? (it.articleTitle ?? it.label) : ""}
          defaultArticleBodyJson={it.articleBodyJson ?? '{"blocks":[]}'}
          defaultIconKey={it.iconKey}
          defaultIconPreviewSrc={iconPreview}
          defaultDocumentPreviewSrc={documentPreview}
          defaultDocumentName={docFile?.originalName}
        />
      </section>
    </div>
  );
}
