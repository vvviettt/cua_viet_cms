import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteAppMobileBannerFormAction, updateAppMobileBannerLinkAction } from "@/app/actions/app-mobile-config";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";
import { findAppMobileBannerById } from "@/lib/db/app-mobile-config";
import { uploadsPublicHref } from "@/lib/uploads/public-url";
import { sessionCanEditModule } from "@/lib/cms-module-access";

type Props = { params: Promise<{ id: string }> };
const linkErrMessages: Record<string, string> = {
  session: "Phiên đăng nhập không hợp lệ.",
  forbidden: "Bạn không có quyền cập nhật.",
  bad_id: "Mã banner không hợp lệ.",
  not_found: "Không tìm thấy banner.",
  bad_protocol: "Link banner phải bắt đầu bằng http hoặc https.",
  bad_link: "Link banner không hợp lệ.",
  save: "Không thể cập nhật link banner.",
};

type SearchProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[]; linkErr?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Banner ${id.slice(0, 8)}… — ${SITE.shortTitle}`,
  };
}

export default async function ChinhSuaBannerAppPage({ params, searchParams }: SearchProps) {
  const { id } = await params;
  const row = await findAppMobileBannerById(id);
  if (!row) notFound();

  const session = await getSession();
  const canEdit = session ? await sessionCanEditModule(session, "app_mobile") : false;
  const src = uploadsPublicHref(row.file.relativePath);
  const sp = await searchParams;
  const linkErrRaw = sp.linkErr;
  const linkErrKey = Array.isArray(linkErrRaw) ? linkErrRaw[0] : linkErrRaw;
  const linkErrMessage = linkErrKey ? linkErrMessages[linkErrKey] ?? null : null;
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Link
          href={appMobileCauHinhPaths.trangChu}
          className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
        >
          ← Cấu hình Trang chủ
        </Link>
      </div>

      <header className="mt-6">
        <h1 className="text-2xl font-bold text-zinc-900">Banner</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Thứ tự và bật hiển thị chỉnh trên trang danh sách. Đổi ảnh: xóa banner này rồi tải lên mới ở cuối trang cấu
          hình.
        </p>
      </header>

      <div className="relative mt-6 aspect-video w-full max-w-md overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
        <Image src={src} alt="" fill className="object-cover" sizes="(max-width: 448px) 100vw, 448px" unoptimized />
      </div>

      {canEdit ? (
        <form action={updateAppMobileBannerLinkAction} className="mt-6 flex max-w-md flex-col gap-3">
          <input type="hidden" name="bannerId" value={row.banner.id} />
          {linkErrMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {linkErrMessage}
            </p>
          ) : null}
          <label className="text-sm font-medium text-zinc-700">Link khi bấm banner (tuỳ chọn)</label>
          <input
            name="redirectUrl"
            type="url"
            inputMode="url"
            defaultValue={row.banner.redirectUrl ?? ""}
            placeholder="https://…"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25"
          />
          <p className="text-xs text-zinc-500">Nếu có, app sẽ mở link trong WebView.</p>
          <button
            type="submit"
            className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover)"
          >
            Lưu link
          </button>
        </form>
      ) : null}

      {canEdit ? (
        <form action={deleteAppMobileBannerFormAction} className="mt-8">
          <input type="hidden" name="bannerId" value={row.banner.id} />
          <input type="hidden" name="returnPath" value={appMobileCauHinhPaths.trangChu} />
          <button
            type="submit"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 transition hover:bg-red-100"
          >
            Xóa banner
          </button>
        </form>
      ) : null}
    </div>
  );
}
