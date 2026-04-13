"use client";

import Image from "next/image";
import { startTransition, useActionState, useRef, useState } from "react";
import {
  deleteNewsArticleFormAction,
  updateNewsArticleEntry,
  type NewsArticleFormState,
} from "@/app/actions/news-articles";
import type { NewsArticleListRow } from "@/lib/db/news-articles";
import { FileLocalPickRow } from "@/components/ui/file-source-picker";
import {
  NewsCategoryPicker,
  type NewsCategoryOption,
} from "@/components/news/news-category-picker";
import { NewsBodyEditor, type NewsEditorHandle } from "@/components/news/news-body-editor";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: NewsArticleFormState = {};

type Props = {
  row: NewsArticleListRow;
  canEdit: boolean;
  categories: NewsCategoryOption[];
  bannerPreviewSrc: string;
};

export function EditNewsForm({ row, canEdit, categories, bannerPreviewSrc }: Props) {
  const [state, formAction, pending] = useActionState(updateNewsArticleEntry, initial);
  const editorRef = useRef<NewsEditorHandle | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  if (!canEdit) {
    return (
      <section className="rounded-xl border border-(--portal-border) bg-zinc-50 p-4 text-sm text-zinc-600">
        Bạn chỉ có quyền xem. Chỉ tài khoản biên tập trở lên mới chỉnh sửa.
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    <div className="space-y-6">
      <section className="rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Chỉnh sửa tin tức</h2>
        <p className="mt-2 text-xs text-zinc-500">
          Tạo lúc {new Date(row.createdAt).toLocaleString("vi-VN")} — bởi{" "}
          <span className="font-medium text-zinc-700">
            {row.authorFullName?.trim() || row.authorEmail}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" encType="multipart/form-data">
          <input type="hidden" name="articleId" value={row.id} />
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
              Đã cập nhật.
            </p>
          ) : null}

          <div>
            <span className="mb-1 block text-sm font-medium text-foreground">
              Danh mục <span className="text-red-600">*</span>
            </span>
            <NewsCategoryPicker
              categories={categories}
              disabled={pending}
              initialCategoryId={row.categoryId}
            />
          </div>

          <div>
            <label htmlFor="news-edit-title" className="mb-1 block text-sm font-medium text-zinc-700">
              Tiêu đề <span className="text-red-600">*</span>
            </label>
            <input
              id="news-edit-title"
              name="title"
              type="text"
              required
              maxLength={300}
              disabled={pending}
              defaultValue={row.title}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="news-edit-banner" className="mb-1 block text-sm font-medium text-zinc-700">
              Ảnh banner mới (tùy chọn)
            </label>
            <p className="mb-2 text-xs text-zinc-500">Để trống nếu giữ banner hiện tại.</p>
            <div className="relative mb-3 h-40 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 sm:h-48">
              <Image
                src={bannerPreviewSrc}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 28rem"
                unoptimized
              />
            </div>
            <FileLocalPickRow
              id="news-edit-banner"
              name="banner"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              disabled={pending}
              title="Chọn ảnh banner mới (tùy chọn)"
              emptyLabel="Không chọn để giữ banner hiện tại…"
              buttonLabel="Chọn ảnh"
            />
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Nội dung <span className="text-red-600">*</span>
            </span>
            <NewsBodyEditor key={row.id} initialJson={row.contentJson} editorRef={editorRef} />
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3">
            <input
              id="news-edit-visible"
              name="isVisible"
              type="checkbox"
              value="on"
              defaultChecked={row.isVisible}
              disabled={pending}
              className="mt-1 size-4 shrink-0 rounded border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
            />
            <div>
              <label htmlFor="news-edit-visible" className="text-sm font-medium text-zinc-800">
                Hiển thị công khai
              </label>
              <p className="mt-0.5 text-xs text-zinc-600">Bỏ chọn để ẩn khỏi API public.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
          >
            {pending ? "Đang lưu…" : "Lưu thay đổi"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-red-200 bg-red-50/50 p-5 shadow-sm sm:p-6">
        <h3 className="text-sm font-semibold text-red-900">Xóa bài viết</h3>
        <p className="mt-1 text-sm text-red-800/90">Thao tác không hoàn tác. Ảnh banner cũng sẽ bị xóa khỏi máy chủ.</p>
        <form action={deleteNewsArticleFormAction} className="mt-4">
          <input type="hidden" name="articleId" value={row.id} />
          <button
            type="submit"
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-50"
          >
            Xóa tin này
          </button>
        </form>
      </section>
    </div>
  );
}
