"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createNewsArticleEntry, type NewsArticleFormState } from "@/app/actions/news-articles";
import {
  NewsCategoryPicker,
  type NewsCategoryOption,
} from "@/components/news/news-category-picker";
import { NewsBodyEditor, type NewsEditorHandle } from "@/components/news/news-body-editor";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: NewsArticleFormState = {};

type Props = {
  canEdit: boolean;
  categories: NewsCategoryOption[];
};

export function CreateNewsForm({ canEdit, categories }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createNewsArticleEntry, initial);
  const editorRef = useRef<NewsEditorHandle | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!state?.ok) return;
    router.push("/tin-tuc");
  }, [state?.ok, router]);

  useEffect(() => {
    return () => {
      if (bannerPreviewUrl) URL.revokeObjectURL(bannerPreviewUrl);
    };
  }, [bannerPreviewUrl]);

  function onBannerFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setBannerPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  if (!canEdit) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Thêm tin tức</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Tài khoản <strong>Chỉ xem</strong> không được thêm. Liên hệ quản trị viên nếu cần quyền biên tập.
        </p>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Phải giữ tham chiếu form trước mọi `await` — sau await, currentTarget có thể không còn là HTMLFormElement.
    const form = e.currentTarget;
    setClientError(null);
    if (!editorRef.current) {
      setClientError("Trình soạn nội dung chưa sẵn sàng. Đợi vài giây rồi thử lại.");
      return;
    }
    let output;
    try {
      output = await editorRef.current.save();
    } catch {
      setClientError("Không đọc được nội dung. Thử lại.");
      return;
    }
    if (!output.blocks?.length) {
      setClientError("Nội dung cần ít nhất một khối (đoạn văn, tiêu đề…).");
      return;
    }
    const fd = new FormData(form);
    const cid = String(fd.get("categoryId") ?? "").trim();
    const nt = String(fd.get("newCategoryTitle") ?? "").trim();
    if (!cid && !nt) {
      setClientError("Vui lòng chọn danh mục.");
      return;
    }
    fd.set("contentJson", JSON.stringify(output));
    startTransition(() => {
      formAction(fd);
    });
  }

  return (
    <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Thêm tin tức / thông báo</h2>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" encType="multipart/form-data">
        {clientError ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
            {clientError}
          </p>
        ) : null}
        {state?.error ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Đã lưu. Đang chuyển về danh sách…
          </p>
        ) : null}

        <div>
          <span className="mb-1 block text-sm font-medium text-foreground">
            Danh mục <span className="text-red-600">*</span>
          </span>
          <NewsCategoryPicker categories={categories} disabled={pending} />
        </div>

        <div>
          <label htmlFor="news-title" className="mb-1 block text-sm font-medium text-zinc-700">
            Tiêu đề <span className="text-red-600">*</span>
          </label>
          <input
            id="news-title"
            name="title"
            type="text"
            required
            maxLength={300}
            disabled={pending}
            className={fieldClass}
            placeholder="Tiêu đề hiển thị công khai"
          />
        </div>

        <div>
          <label htmlFor="news-banner" className="mb-1 block text-sm font-medium text-zinc-700">
            Ảnh banner <span className="text-red-600">*</span>
          </label>
          <input
            id="news-banner"
            name="banner"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            disabled={pending}
            onChange={onBannerFileChange}
            className={`${fieldClass} py-2 file:mr-3 file:rounded file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-sm`}
          />
          <p className="mt-1 text-xs text-zinc-500">JPG, PNG, WEBP hoặc GIF — tối đa 8MB.</p>
          {bannerPreviewUrl ? (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-zinc-600">Xem trước banner (16:9)</p>
              <div className="max-w-3xl overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-inner">
                <div className="relative aspect-video w-full">
                  {/* blob: URL — không dùng next/image */}
                  <img
                    src={bannerPreviewUrl}
                    alt="Xem trước ảnh banner"
                    className="size-full object-cover"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Nội dung <span className="text-red-600">*</span>
          </span>
          <NewsBodyEditor initialJson={null} editorRef={editorRef} />
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3">
          <input
            id="news-visible"
            name="isVisible"
            type="checkbox"
            value="on"
            defaultChecked
            disabled={pending}
            className="mt-1 size-4 shrink-0 rounded border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
          />
          <div>
            <label htmlFor="news-visible" className="text-sm font-medium text-zinc-800">
              Hiển thị công khai
            </label>
            <p className="mt-0.5 text-xs text-zinc-600">Bỏ chọn để lưu nháp, chưa đăng.</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu tin"}
        </button>
      </form>
    </section>
  );
}
