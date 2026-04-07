"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session-cookie";
import { deleteFileRecordById, findFileById, insertUploadedFile } from "@/lib/db/file-records";
import {
  findNewsArticleCategoryById,
  insertNewsArticleCategoryOrGetExisting,
} from "@/lib/db/news-article-categories";
import {
  deleteNewsArticleById,
  findNewsArticleById,
  insertNewsArticle,
  updateNewsArticle,
} from "@/lib/db/news-articles";
import { canEditContent } from "@/lib/roles";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "tin-tuc");
const MAX_BANNER_BYTES = 8 * 1024 * 1024;
const RELATIVE_PREFIX = "tin-tuc";
const MAX_TITLE = 300;
const MAX_CATEGORY_TITLE = 200;
const MAX_CONTENT_BYTES = 600_000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type NewsArticleFormState = { ok?: boolean; error?: string };

function extFromUpload(file: File, nameLower: string): { ext: string; mime: string } | null {
  const mime = (file.type || "").toLowerCase();
  if (nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg")) {
    if (mime && !["image/jpeg", "image/jpg", "application/octet-stream"].includes(mime)) return null;
    return { ext: "jpg", mime: mime || "image/jpeg" };
  }
  if (nameLower.endsWith(".png")) {
    if (mime && !["image/png", "application/octet-stream"].includes(mime)) return null;
    return { ext: "png", mime: mime || "image/png" };
  }
  if (nameLower.endsWith(".webp")) {
    if (mime && !["image/webp", "application/octet-stream"].includes(mime)) return null;
    return { ext: "webp", mime: mime || "image/webp" };
  }
  if (nameLower.endsWith(".gif")) {
    if (mime && !["image/gif", "application/octet-stream"].includes(mime)) return null;
    return { ext: "gif", mime: mime || "image/gif" };
  }
  return null;
}

function parseContentJson(raw: string): { ok: true; json: string } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Vui lòng nhập nội dung bài viết." };
  if (raw.length > MAX_CONTENT_BYTES) {
    return { ok: false, error: "Nội dung quá dài." };
  }
  let data: unknown;
  try {
    data = JSON.parse(trimmed);
  } catch {
    return { ok: false, error: "Nội dung không đúng định dạng (JSON)." };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Nội dung không hợp lệ." };
  }
  const blocks = (data as { blocks?: unknown }).blocks;
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return {
      ok: false,
      error: "Nội dung cần ít nhất một khối (đoạn văn, tiêu đề…).",
    };
  }
  return { ok: true, json: trimmed };
}

async function resolveArticleCategoryId(formData: FormData): Promise<
  { ok: true; categoryId: string } | { ok: false; error: string }
> {
  const newTitle = String(formData.get("newCategoryTitle") ?? "").trim();
  const rawId = String(formData.get("categoryId") ?? "").trim();

  if (newTitle) {
    if (newTitle.length > MAX_CATEGORY_TITLE) {
      return { ok: false, error: `Tên danh mục tối đa ${MAX_CATEGORY_TITLE} ký tự.` };
    }
    try {
      const id = await insertNewsArticleCategoryOrGetExisting(newTitle);
      return { ok: true, categoryId: id };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "Không thể tạo danh mục mới." };
    }
  }

  if (!rawId) {
    return { ok: false, error: "Vui lòng chọn danh mục." };
  }
  if (!UUID_RE.test(rawId)) {
    return { ok: false, error: "Danh mục không hợp lệ." };
  }
  const cat = await findNewsArticleCategoryById(rawId);
  if (!cat) {
    return { ok: false, error: "Không tìm thấy danh mục đã chọn." };
  }
  return { ok: true, categoryId: rawId };
}

async function saveNewsBanner(
  session: SessionPayload,
  file: File,
): Promise<{ ok: true; fileId: string } | { ok: false; error: string }> {
  const nameLower = file.name.toLowerCase();
  const parsed = extFromUpload(file, nameLower);
  if (!parsed) {
    return { ok: false, error: "Banner chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF." };
  }
  if (file.size > MAX_BANNER_BYTES) {
    return { ok: false, error: "Ảnh banner tối đa 8MB." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 10) {
    return { ok: false, error: "File ảnh không hợp lệ." };
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `banner-${randomUUID()}.${parsed.ext}`;
  const diskPath = path.join(UPLOAD_DIR, fileName);
  const relativePath = `${RELATIVE_PREFIX}/${fileName}`;

  await writeFile(diskPath, buf);

  try {
    const fileId = await insertUploadedFile({
      category: "news_banner",
      relativePath,
      originalName: file.name,
      mimeType: parsed.mime,
      sizeBytes: buf.length,
      uploadedById: session.userId,
    });
    return { ok: true, fileId };
  } catch (e) {
    console.error(e);
    try {
      await unlink(diskPath);
    } catch {
      /* ignore */
    }
    return { ok: false, error: "Không thể lưu bản ghi file. Thử lại sau." };
  }
}

async function removeBannerFileById(fileId: string): Promise<void> {
  const row = await findFileById(fileId);
  if (!row) return;
  const diskPath = path.join(process.cwd(), "public", "uploads", row.relativePath);
  try {
    await unlink(diskPath);
  } catch {
    /* ignore */
  }
  try {
    await deleteFileRecordById(fileId);
  } catch {
    /* ignore */
  }
}

export async function createNewsArticleEntry(
  _prev: NewsArticleFormState,
  formData: FormData,
): Promise<NewsArticleFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền thêm tin." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Vui lòng nhập tiêu đề." };
  if (title.length > MAX_TITLE) return { error: `Tiêu đề tối đa ${MAX_TITLE} ký tự.` };

  const contentParsed = parseContentJson(String(formData.get("contentJson") ?? ""));
  if (!contentParsed.ok) return { error: contentParsed.error };

  const file = formData.get("banner");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vui lòng chọn ảnh banner." };
  }

  const saved = await saveNewsBanner(session, file);
  if (!saved.ok) return { error: saved.error };

  const isVisible = formData.get("isVisible") === "on";

  const categoryResolved = await resolveArticleCategoryId(formData);
  if (!categoryResolved.ok) return { error: categoryResolved.error };

  try {
    await insertNewsArticle({
      title,
      categoryId: categoryResolved.categoryId,
      bannerFileId: saved.fileId,
      contentJson: contentParsed.json,
      createdByUserId: session.userId,
      isVisible,
    });
  } catch (e) {
    console.error(e);
    await removeBannerFileById(saved.fileId);
    return { error: "Không thể lưu tin. Thử lại sau." };
  }

  revalidatePath("/tin-tuc");
  revalidatePath("/api/public/news");
  return { ok: true };
}

export async function updateNewsArticleEntry(
  _prev: NewsArticleFormState,
  formData: FormData,
): Promise<NewsArticleFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("articleId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã bài viết không hợp lệ." };

  const existing = await findNewsArticleById(id);
  if (!existing) return { error: "Không tìm thấy bài viết." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Vui lòng nhập tiêu đề." };
  if (title.length > MAX_TITLE) return { error: `Tiêu đề tối đa ${MAX_TITLE} ký tự.` };

  const contentParsed = parseContentJson(String(formData.get("contentJson") ?? ""));
  if (!contentParsed.ok) return { error: contentParsed.error };

  const isVisible = formData.get("isVisible") === "on";

  const file = formData.get("banner");
  let bannerFileId = existing.bannerFileId;
  let newBannerId: string | null = null;

  if (file instanceof File && file.size > 0) {
    const saved = await saveNewsBanner(session, file);
    if (!saved.ok) return { error: saved.error };
    newBannerId = saved.fileId;
    bannerFileId = saved.fileId;
  }

  const categoryResolved = await resolveArticleCategoryId(formData);
  if (!categoryResolved.ok) return { error: categoryResolved.error };

  try {
    await updateNewsArticle(id, {
      title,
      categoryId: categoryResolved.categoryId,
      bannerFileId,
      contentJson: contentParsed.json,
      isVisible,
    });
  } catch (e) {
    console.error(e);
    if (newBannerId) {
      await removeBannerFileById(newBannerId);
    }
    return { error: "Không thể cập nhật. Thử lại sau." };
  }

  if (newBannerId && newBannerId !== existing.bannerFileId) {
    await removeBannerFileById(existing.bannerFileId);
  }

  revalidatePath("/tin-tuc");
  revalidatePath(`/tin-tuc/${id}/chinh-sua`);
  revalidatePath("/api/public/news");
  return { ok: true };
}

export async function deleteNewsArticleFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) {
    redirect("/tin-tuc");
  }

  const id = String(formData.get("articleId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) {
    redirect("/tin-tuc");
  }

  const existing = await findNewsArticleById(id);
  if (!existing) {
    redirect("/tin-tuc");
  }

  const bannerId = existing.bannerFileId;

  try {
    await deleteNewsArticleById(id);
  } catch (e) {
    console.error(e);
    redirect("/tin-tuc");
  }

  await removeBannerFileById(bannerId);

  revalidatePath("/tin-tuc");
  revalidatePath("/api/public/news");
  redirect("/tin-tuc");
}
