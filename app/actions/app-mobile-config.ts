"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session-cookie";
import { isValidAppMobileIconKey } from "@/lib/app-mobile-icon-keys";
import { isValidNativeRouteId } from "@/lib/app-mobile-native-routes";
import { deleteFileRecordById, findFileById, insertUploadedFile } from "@/lib/db/file-records";
import { removeSupabaseObject, uploadBufferToSupabase } from "@/lib/uploads/supabase-storage";
import {
  deleteAppMobileBannerRow,
  deleteAppMobileItem,
  deleteAppMobileSection,
  deleteAppMobileHomeBannerItem,
  deleteAppMobileHomeBannerSection,
  ensureAppMobileThemeRow,
  ensureAppMobileHomeBannerRow,
  type AppHomeBannerPlacement,
  type AppHomeBannerCtaKey,
  findAppMobileBannerById,
  findAppMobileItemById,
  findAppMobileSectionById,
  insertAppMobileBanner,
  insertAppMobileItem,
  insertAppMobileSection,
  insertAppMobileHomeBannerItem,
  insertAppMobileHomeBannerSection,
  moveAppMobileHomeBannerItemRelative,
  moveAppMobileHomeBannerSectionRelative,
  nextAppMobileHomeBannerItemSortOrderInSection,
  nextAppMobileHomeBannerSectionSortOrder,
  findAppMobileHomeBannerItemById,
  findAppMobileHomeBannerSectionById,
  moveAppMobileBannerRelative,
  moveAppMobileItemRelative,
  moveAppMobileSectionRelative,
  moveAppMobileShellTabRelative,
  nextAppMobileBannerSortOrder,
  nextAppMobileItemSortOrderInSection,
  nextAppMobileSectionSortOrder,
  setAppMobileBannerActive,
  setAppMobileItemActive,
  setAppMobileItemDefaultFavorite,
  setAppMobileSectionActive,
  setAppMobileShellTabActive,
  setAppMobileHomeBannerItemActive,
  setAppMobileHomeBannerSectionActive,
  updateAppMobileBannerLink,
  updateAppMobileHomeBannerItemContent,
  updateAppMobileHomeBannerSectionTitle,
  updateAppMobileItemContent,
  updateAppMobileSectionTitle,
  updateAppMobileHomeBanner,
  updateAppMobileTheme,
} from "@/lib/db/app-mobile-config";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";
import { sessionCanEditModule } from "@/lib/cms-module-access";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const HEX6_RE = /^#[0-9A-Fa-f]{6}$/;
const MAX_BANNER_BYTES = 8 * 1024 * 1024;
const MAX_ICON_BYTES = 512 * 1024;
const MAX_MENU_DOCUMENT_BYTES = 100 * 1024 * 1024;
const RELATIVE_PREFIX = "app-home";
const ICON_RELATIVE_PREFIX = "app-home-icons";
const MENU_DOC_RELATIVE_PREFIX = "app-home-menu-docs";
const DEFAULT_ITEM_ACCENT_HEX = "#1565C0";

const CAU_HINH_APP_MENU = appMobileCauHinhPaths.trangChu;

function resolveBannerListHref(formData: FormData): string {
  const raw = String(formData.get("returnPath") ?? "").trim();
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return appMobileCauHinhPaths.trangChu;
}

function revalidateCauHinhAppTree() {
  revalidatePath(appMobileCauHinhPaths.hub, "layout");
}

function parsePlacement(raw: string): AppHomeBannerPlacement | null {
  if (raw === "top" || raw === "after_section_2") return raw;
  return null;
}

export type AppMobileFormState = { ok?: boolean; error?: string };

function parseUseCustomIcon(raw: string): boolean {
  return raw.trim() === "true";
}

function extFromUpload(file: File, nameLower: string): { ext: string; mime: string } | null {
  const mime = (file.type || "").toLowerCase();
  if (nameLower.endsWith(".svg")) {
    // Some browsers may send empty mime for local SVG; accept if extension is correct.
    if (mime && !["image/svg+xml", "application/octet-stream"].includes(mime)) return null;
    return { ext: "svg", mime: mime || "image/svg+xml" };
  }
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

async function saveAppHomeBannerFile(
  session: SessionPayload,
  file: File,
): Promise<{ ok: true; fileId: string } | { ok: false; error: string }> {
  const nameLower = file.name.toLowerCase();
  const parsed = extFromUpload(file, nameLower);
  if (!parsed) {
    return { ok: false, error: "Ảnh chỉ nhận JPG, PNG, WEBP hoặc GIF." };
  }
  if (file.size > MAX_BANNER_BYTES) {
    return { ok: false, error: "Ảnh tối đa 8MB." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 10) {
    return { ok: false, error: "File ảnh không hợp lệ." };
  }

  const fileName = `banner-${randomUUID()}.${parsed.ext}`;
  const relativePath = `${RELATIVE_PREFIX}/${fileName}`;

  await uploadBufferToSupabase({
    relativePath,
    buf,
    contentType: parsed.mime,
    cacheControl: "3600",
    upsert: false,
  });

  try {
    const fileId = await insertUploadedFile({
      category: "app_home_banner",
      relativePath,
      originalName: file.name,
      mimeType: parsed.mime,
      sizeBytes: buf.length,
      uploadedById: session.userId,
    });
    return { ok: true, fileId };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Không thể lưu file. Thử lại sau." };
  }
}

function extFromMenuDocument(file: File, nameLower: string): { ext: string; mime: string } | null {
  const mime = (file.type || "").toLowerCase();
  const octetOk = !mime || mime === "application/octet-stream";
  if (nameLower.endsWith(".pdf")) {
    if (mime && !octetOk && mime !== "application/pdf") return null;
    return { ext: "pdf", mime: mime || "application/pdf" };
  }
  if (nameLower.endsWith(".docx")) {
    if (
      mime &&
      !octetOk &&
      mime !== "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return null;
    }
    return {
      ext: "docx",
      mime: mime || "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };
  }
  if (nameLower.endsWith(".doc")) {
    if (mime && !octetOk && mime !== "application/msword") return null;
    return { ext: "doc", mime: mime || "application/msword" };
  }
  if (nameLower.endsWith(".xlsx")) {
    if (
      mime &&
      !octetOk &&
      mime !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return null;
    }
    return {
      ext: "xlsx",
      mime: mime || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
  }
  if (nameLower.endsWith(".xls")) {
    if (mime && !octetOk && mime !== "application/vnd.ms-excel") return null;
    return { ext: "xls", mime: mime || "application/vnd.ms-excel" };
  }
  return null;
}

async function saveAppHomeMenuDocumentFile(
  session: SessionPayload,
  file: File,
): Promise<{ ok: true; fileId: string } | { ok: false; error: string }> {
  const nameLower = file.name.toLowerCase();
  const parsed = extFromMenuDocument(file, nameLower);
  if (!parsed) {
    return { ok: false, error: "Chỉ nhận PDF, Word (.doc/.docx) hoặc Excel (.xls/.xlsx)." };
  }
  if (file.size > MAX_MENU_DOCUMENT_BYTES) {
    return { ok: false, error: "Tệp tối đa 100MB." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 16) {
    return { ok: false, error: "Tệp không hợp lệ." };
  }
  const fileName = `menu-doc-${randomUUID()}.${parsed.ext}`;
  const relativePath = `${MENU_DOC_RELATIVE_PREFIX}/${fileName}`;
  await uploadBufferToSupabase({
    relativePath,
    buf,
    contentType: parsed.mime,
    cacheControl: "3600",
    upsert: false,
  });
  try {
    const fileId = await insertUploadedFile({
      category: "app_home_menu_document",
      relativePath,
      originalName: file.name,
      mimeType: parsed.mime,
      sizeBytes: buf.length,
      uploadedById: session.userId,
    });
    return { ok: true, fileId };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Không thể lưu tệp. Thử lại sau." };
  }
}

async function saveAppHomeIconFile(
  session: SessionPayload,
  file: File,
): Promise<{ ok: true; fileId: string } | { ok: false; error: string }> {
  const nameLower = file.name.toLowerCase();
  const parsed = extFromUpload(file, nameLower);
  if (!parsed) {
    return { ok: false, error: "Icon chỉ nhận SVG." };
  }
  if (parsed.ext !== "svg") return { ok: false, error: "Icon chỉ nhận SVG." };
  if (file.size > MAX_ICON_BYTES) {
    return { ok: false, error: "Icon tối đa 512KB." };
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 10) {
    return { ok: false, error: "File icon không hợp lệ." };
  }

  const fileName = `icon-${randomUUID()}.${parsed.ext}`;
  const relativePath = `${ICON_RELATIVE_PREFIX}/${fileName}`;
  await uploadBufferToSupabase({
    relativePath,
    buf,
    contentType: parsed.mime,
    cacheControl: "3600",
    upsert: false,
  });

  try {
    const fileId = await insertUploadedFile({
      category: "app_home_icon",
      relativePath,
      originalName: file.name,
      mimeType: parsed.mime,
      sizeBytes: buf.length,
      uploadedById: session.userId,
    });
    return { ok: true, fileId };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Không thể lưu file icon. Thử lại sau." };
  }
}

async function removeBannerFileById(fileId: string): Promise<void> {
  const row = await findFileById(fileId);
  if (!row) return;
  try {
    await removeSupabaseObject(row.relativePath);
  } catch {
    /* ignore */
  }
  try {
    await deleteFileRecordById(fileId);
  } catch {
    /* ignore */
  }
}

export async function updateAppMobileThemeAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  await ensureAppMobileThemeRow();

  const primarySeedHex = String(formData.get("primarySeedHex") ?? "").trim();
  if (!HEX6_RE.test(primarySeedHex)) {
    return { error: "Màu chủ đạo phải là mã hex 6 số (#RRGGBB), ví dụ #0D47A1." };
  }

  const homeHeroTitle = String(formData.get("homeHeroTitle") ?? "").trim();
  if (homeHeroTitle.length > 500) return { error: "Tiêu đề tối đa 500 ký tự." };

  try {
    await updateAppMobileTheme({ primarySeedHex, homeHeroTitle });
  } catch (e) {
    console.error(e);
    return { error: "Không thể lưu. Thử lại sau." };
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

function parseCtaKey(raw: string): AppHomeBannerCtaKey | null {
  if (raw === "apply_online" || raw === "lookup_result") return raw;
  return null;
}

export async function updateAppMobileHomeBannerAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  const bannerRow = await ensureAppMobileHomeBannerRow();
  const oldDecorationFileId = bannerRow.decorationFileId;

  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const applyLabel = String(formData.get("applyLabel") ?? "").trim();
  const lookupLabel = String(formData.get("lookupLabel") ?? "").trim();

  if (!title) return { error: "Vui lòng nhập tiêu đề dòng 1." };
  if (title.length > 80) return { error: "Tiêu đề dòng 1 tối đa 80 ký tự." };
  if (!subtitle) return { error: "Vui lòng nhập tiêu đề dòng 2." };
  if (subtitle.length > 120) return { error: "Tiêu đề dòng 2 tối đa 120 ký tự." };
  if (!applyLabel) return { error: "Vui lòng nhập nhãn nút 1." };
  if (applyLabel.length > 60) return { error: "Nhãn nút 1 tối đa 60 ký tự." };
  if (!lookupLabel) return { error: "Vui lòng nhập nhãn nút 2." };
  if (lookupLabel.length > 60) return { error: "Nhãn nút 2 tối đa 60 ký tự." };

  const decorationUpload = formData.get("decoration");
  const clearDecoration =
    formData.get("clearDecoration") === "1" ||
    formData.get("clearDecoration") === "on";

  let nextDecorationFileId: string | null | undefined = undefined;
  if (decorationUpload instanceof File && decorationUpload.size > 0) {
    const saved = await saveAppHomeBannerFile(session, decorationUpload);
    if (!saved.ok) return { error: saved.error };
    nextDecorationFileId = saved.fileId;
  } else if (clearDecoration) {
    nextDecorationFileId = null;
  }

  try {
    await updateAppMobileHomeBanner({
      title,
      subtitle,
      applyLabel,
      lookupLabel,
      ...(nextDecorationFileId !== undefined ? { decorationFileId: nextDecorationFileId } : {}),
    });
  } catch (e) {
    console.error(e);
    if (nextDecorationFileId != null) await removeBannerFileById(nextDecorationFileId);
    return { error: "Không thể lưu. Thử lại sau." };
  }

  if (
    nextDecorationFileId !== undefined &&
    oldDecorationFileId &&
    oldDecorationFileId !== nextDecorationFileId
  ) {
    await removeBannerFileById(oldDecorationFileId);
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

export async function createAppMobileBannerAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền thêm." };

  const placementRaw = String(formData.get("placement") ?? "").trim();
  const placement = parsePlacement(placementRaw) ?? "top";

  const file = formData.get("banner");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vui lòng chọn ảnh banner." };
  }

  const saved = await saveAppHomeBannerFile(session, file);
  if (!saved.ok) return { error: saved.error };

  const redirectUrlRaw = String(formData.get("redirectUrl") ?? "").trim();
  let redirectUrl: string | null = null;
  if (redirectUrlRaw) {
    try {
      const u = new URL(redirectUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { error: "Link banner phải bắt đầu bằng http hoặc https." };
      }
      redirectUrl = redirectUrlRaw;
    } catch {
      return { error: "Link banner không hợp lệ." };
    }
  }

  const sortOrder = await nextAppMobileBannerSortOrder(placement);

  try {
    await insertAppMobileBanner({
      fileId: saved.fileId,
      placement,
      redirectUrl,
      routePath: null,
      sortOrder,
      isActive: true,
    });
  } catch (e) {
    console.error(e);
    await removeBannerFileById(saved.fileId);
    return { error: "Không thể lưu banner." };
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

const bannerLinkEditPath = (bannerId: string) => `/cau-hinh-app/banner/${bannerId}/chinh-sua`;

export async function updateAppMobileBannerLinkAction(formData: FormData): Promise<void> {
  const id = String(formData.get("bannerId") ?? "").trim();
  const back = id && UUID_RE.test(id) ? bannerLinkEditPath(id) : appMobileCauHinhPaths.trangChu;

  const session = await getSession();
  if (!session) redirect(`${back}?linkErr=session`);
  if (!(await sessionCanEditModule(session, "app_mobile"))) redirect(`${back}?linkErr=forbidden`);

  if (!id || !UUID_RE.test(id)) redirect(`${back}?linkErr=bad_id`);

  const existing = await findAppMobileBannerById(id);
  if (!existing) redirect(`${back}?linkErr=not_found`);

  const redirectUrlRaw = String(formData.get("redirectUrl") ?? "").trim();
  let redirectUrl: string | null = null;
  if (redirectUrlRaw) {
    try {
      const u = new URL(redirectUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        redirect(`${bannerLinkEditPath(id)}?linkErr=bad_protocol`);
      }
      redirectUrl = redirectUrlRaw;
    } catch {
      redirect(`${bannerLinkEditPath(id)}?linkErr=bad_link`);
    }
  }

  try {
    await updateAppMobileBannerLink(id, { redirectUrl, routePath: null });
  } catch (e) {
    console.error(e);
    redirect(`${bannerLinkEditPath(id)}?linkErr=save`);
  }

  revalidateCauHinhAppTree();
  revalidatePath(bannerLinkEditPath(id));
  redirect(bannerLinkEditPath(id));
}

export async function deleteAppMobileBannerFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  const backHref = resolveBannerListHref(formData);
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) {
    redirect(backHref);
  }

  const id = String(formData.get("bannerId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) redirect(backHref);

  const existing = await findAppMobileBannerById(id);
  if (!existing) redirect(backHref);

  const fileId = existing.banner.fileId;
  try {
    await deleteAppMobileBannerRow(id);
  } catch (e) {
    console.error(e);
    redirect(backHref);
  }

  await removeBannerFileById(fileId);
  revalidateCauHinhAppTree();
  redirect(backHref);
}

export async function createAppMobileSectionAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền thêm." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Vui lòng nhập tên nhóm." };
  if (title.length > 200) return { error: "Tên nhóm tối đa 200 ký tự." };

  const iconFile = formData.get("iconFile");
  if (!(iconFile instanceof File) || iconFile.size === 0) {
    return { error: "Vui lòng upload icon (SVG) cho nhóm." };
  }
  const savedIcon = await saveAppHomeIconFile(session, iconFile);
  if (!savedIcon.ok) return { error: savedIcon.error };
  const iconFileId = savedIcon.fileId;

  const sortOrder = await nextAppMobileSectionSortOrder();

  try {
    await insertAppMobileSection({ title, iconFileId, sortOrder, isActive: true });
  } catch (e) {
    console.error(e);
    await removeBannerFileById(iconFileId);
    return { error: "Không thể thêm nhóm." };
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

export async function createAppMobileHomeBannerSectionAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền thêm." };

  const ctaKey = parseCtaKey(String(formData.get("ctaKey") ?? "").trim());
  if (!ctaKey) return { error: "CTA không hợp lệ." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Vui lòng nhập tên nhóm." };
  if (title.length > 200) return { error: "Tên nhóm tối đa 200 ký tự." };

  const kind = parseHomeBannerItemKind(String(formData.get("kind") ?? ""));
  if (!kind) return { error: "Loại mục không hợp lệ." };
  const routeIdRaw = String(formData.get("routeId") ?? "").trim();
  const webUrlRaw = String(formData.get("webUrl") ?? "").trim();
  const documentUpload = formData.get("documentFile");
  let routeId: string | null = null;
  let webUrl: string | null = null;
  if (kind === "native") {
    if (!routeIdRaw || !isValidNativeRouteId(routeIdRaw)) {
      return { error: "Vui lòng chọn route native hợp lệ." };
    }
    routeId = routeIdRaw;
  } else if (kind === "webview") {
    if (!webUrlRaw) return { error: "Vui lòng nhập URL cho webview." };
    if (webUrlRaw.length > 2000) return { error: "URL quá dài." };
    try {
      const u = new URL(webUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { error: "URL phải bắt đầu bằng http hoặc https." };
      }
    } catch {
      return { error: "URL không hợp lệ." };
    }
    webUrl = webUrlRaw;
  } else {
    if (!(documentUpload instanceof File) || documentUpload.size === 0) {
      return { error: "Chọn tệp PDF, Word hoặc Excel." };
    }
  }

  const iconFile = formData.get("iconFile");
  if (!(iconFile instanceof File) || iconFile.size === 0) {
    return { error: "Vui lòng upload icon (SVG) cho nhóm." };
  }
  const savedIcon = await saveAppHomeIconFile(session, iconFile);
  if (!savedIcon.ok) return { error: savedIcon.error };
  const iconFileId = savedIcon.fileId;

  let documentFileId: string | null = null;
  let newDocFileId: string | null = null;
  if (kind === "file") {
    const savedDoc = await saveAppHomeMenuDocumentFile(session, documentUpload as File);
    if (!savedDoc.ok) {
      await removeBannerFileById(iconFileId);
      return { error: savedDoc.error };
    }
    documentFileId = savedDoc.fileId;
    newDocFileId = savedDoc.fileId;
  }

  const sortOrder = await nextAppMobileHomeBannerSectionSortOrder(ctaKey);

  try {
    await insertAppMobileHomeBannerSection({
      ctaKey,
      title,
      iconFileId,
      kind,
      routeId,
      webUrl,
      documentFileId,
      sortOrder,
      isActive: true,
    });
  } catch (e) {
    console.error(e);
    await removeBannerFileById(iconFileId);
    if (newDocFileId) await removeBannerFileById(newDocFileId);
    return { error: "Không thể thêm nhóm." };
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

export async function updateAppMobileHomeBannerSectionAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("sectionId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã nhóm không hợp lệ." };
  const existing = await findAppMobileHomeBannerSectionById(id);
  if (!existing) return { error: "Không tìm thấy nhóm." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Vui lòng nhập tên nhóm." };
  if (title.length > 200) return { error: "Tên nhóm tối đa 200 ký tự." };

  const kind = parseHomeBannerItemKind(String(formData.get("kind") ?? ""));
  if (!kind) return { error: "Loại mục không hợp lệ." };
  const routeIdRaw = String(formData.get("routeId") ?? "").trim();
  const webUrlRaw = String(formData.get("webUrl") ?? "").trim();
  const documentUpload = formData.get("documentFile");
  let routeId: string | null = null;
  let webUrl: string | null = null;
  let documentFileId: string | null = existing.documentFileId ?? null;
  if (kind === "native") {
    if (!routeIdRaw || !isValidNativeRouteId(routeIdRaw)) {
      return { error: "Vui lòng chọn route native hợp lệ." };
    }
    routeId = routeIdRaw;
    documentFileId = null;
  } else if (kind === "webview") {
    if (!webUrlRaw) return { error: "Vui lòng nhập URL cho webview." };
    if (webUrlRaw.length > 2000) return { error: "URL quá dài." };
    try {
      const u = new URL(webUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { error: "URL phải bắt đầu bằng http hoặc https." };
      }
    } catch {
      return { error: "URL không hợp lệ." };
    }
    webUrl = webUrlRaw;
    documentFileId = null;
  } else {
    routeId = null;
    webUrl = null;
    const shouldUploadDoc = documentUpload instanceof File && documentUpload.size > 0;
    if (shouldUploadDoc) {
      const savedDoc = await saveAppHomeMenuDocumentFile(session, documentUpload as File);
      if (!savedDoc.ok) return { error: savedDoc.error };
      documentFileId = savedDoc.fileId;
    } else if (!documentFileId) {
      return { error: "Chọn tệp PDF, Word hoặc Excel." };
    }
  }

  const iconFile = formData.get("iconFile");
  const shouldUploadNew = iconFile instanceof File && iconFile.size > 0;
  let nextIconFileId: string | null = existing.iconFileId ?? null;
  let newIconFileId: string | null = null;
  if (shouldUploadNew) {
    const saved = await saveAppHomeIconFile(session, iconFile as File);
    if (!saved.ok) return { error: saved.error };
    newIconFileId = saved.fileId;
    nextIconFileId = newIconFileId;
  } else if (!nextIconFileId) {
    return { error: "Nhóm chưa có icon. Vui lòng upload icon (SVG) cho nhóm." };
  }

  const oldDocumentFileId = existing.documentFileId ?? null;
  let newDocumentFileId: string | null = null;
  if (kind === "file" && documentUpload instanceof File && documentUpload.size > 0) {
    newDocumentFileId = documentFileId;
  }

  try {
    await updateAppMobileHomeBannerSectionTitle(id, {
      title,
      iconFileId: nextIconFileId,
      kind,
      routeId,
      webUrl,
      documentFileId,
    });
  } catch (e) {
    console.error(e);
    if (newIconFileId) await removeBannerFileById(newIconFileId);
    if (newDocumentFileId) await removeBannerFileById(newDocumentFileId);
    return { error: "Không thể cập nhật." };
  }

  const oldIconFileId = existing.iconFileId ?? null;
  if (oldIconFileId && oldIconFileId !== nextIconFileId) {
    await removeBannerFileById(oldIconFileId);
  }
  if (oldDocumentFileId && oldDocumentFileId !== documentFileId) {
    await removeBannerFileById(oldDocumentFileId);
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

export async function deleteAppMobileHomeBannerSectionFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) redirect(CAU_HINH_APP_MENU);

  const id = String(formData.get("sectionId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) redirect(CAU_HINH_APP_MENU);
  const existing = await findAppMobileHomeBannerSectionById(id);
  if (!existing) redirect(CAU_HINH_APP_MENU);

  const iconId = existing.iconFileId ?? null;
  const docId = existing.documentFileId ?? null;
  try {
    await deleteAppMobileHomeBannerSection(id);
  } catch (e) {
    console.error(e);
  }
  if (iconId) {
    try {
      await removeBannerFileById(iconId);
    } catch {
      /* ignore */
    }
  }
  if (docId) {
    try {
      await removeBannerFileById(docId);
    } catch {
      /* ignore */
    }
  }
  revalidateCauHinhAppTree();
  redirect(CAU_HINH_APP_MENU);
}

export async function moveAppMobileHomeBannerSectionServer(
  id: string,
  ctaKey: AppHomeBannerCtaKey,
  direction: "up" | "down",
): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await moveAppMobileHomeBannerSectionRelative(id, ctaKey, direction);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function setAppMobileHomeBannerSectionActiveServer(id: string, isActive: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileHomeBannerSectionActive(id, isActive);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function createAppMobileHomeBannerItemAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền thêm." };

  const sectionId = String(formData.get("sectionId") ?? "").trim();
  if (!sectionId || !UUID_RE.test(sectionId)) return { error: "Nhóm CTA không hợp lệ." };
  const section = await findAppMobileHomeBannerSectionById(sectionId);
  if (!section) return { error: "Không tìm thấy nhóm CTA." };

  const kind = parseItemKind(String(formData.get("kind") ?? ""));
  if (!kind) return { error: "Loại mục không hợp lệ." };

  const routeIdRaw = String(formData.get("routeId") ?? "").trim();
  const webUrlRaw = String(formData.get("webUrl") ?? "").trim();
  let routeId: string | null = null;
  let webUrl: string | null = null;
  if (kind === "native") {
    if (!routeIdRaw || !isValidNativeRouteId(routeIdRaw)) {
      return { error: "Vui lòng chọn route native hợp lệ." };
    }
    routeId = routeIdRaw;
  } else {
    if (!webUrlRaw) return { error: "Vui lòng nhập URL cho webview." };
    if (webUrlRaw.length > 2000) return { error: "URL quá dài." };
    try {
      const u = new URL(webUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { error: "URL phải bắt đầu bằng http hoặc https." };
      }
    } catch {
      return { error: "URL không hợp lệ." };
    }
    webUrl = webUrlRaw;
  }

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Vui lòng nhập nhãn hiển thị." };
  if (label.length > 120) return { error: "Nhãn tối đa 120 ký tự." };

  const iconKey = String(formData.get("iconKey") ?? "").trim() || "help_outline";
  if (!isValidAppMobileIconKey(iconKey)) return { error: "Icon không hợp lệ." };

  const useCustomIcon = parseUseCustomIcon(String(formData.get("useCustomIcon") ?? "false"));
  const iconFile = formData.get("iconFile");
  let iconFileId: string | null = null;
  if (useCustomIcon) {
    if (!(iconFile instanceof File) || iconFile.size == 0) return { error: "Vui lòng chọn file icon." };
    const saved = await saveAppHomeIconFile(session, iconFile);
    if (!saved.ok) return { error: saved.error };
    iconFileId = saved.fileId;
  }

  const accentHex = DEFAULT_ITEM_ACCENT_HEX;
  const sortOrder = await nextAppMobileHomeBannerItemSortOrderInSection(sectionId);

  try {
    await insertAppMobileHomeBannerItem({
      sectionId,
      kind,
      routeId,
      webUrl,
      label,
      iconKey,
      iconFileId,
      accentHex,
      sortOrder,
      isActive: true,
    });
  } catch (e) {
    console.error(e);
    if (iconFileId) await removeBannerFileById(iconFileId);
    return { error: "Không thể thêm mục." };
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

export async function updateAppMobileHomeBannerItemAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("itemId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã mục không hợp lệ." };
  const existing = await findAppMobileHomeBannerItemById(id);
  if (!existing) return { error: "Không tìm thấy mục." };

  const kind = parseItemKind(String(formData.get("kind") ?? ""));
  if (!kind) return { error: "Loại mục không hợp lệ." };

  const routeIdRaw = String(formData.get("routeId") ?? "").trim();
  const webUrlRaw = String(formData.get("webUrl") ?? "").trim();
  let routeId: string | null = null;
  let webUrl: string | null = null;
  if (kind === "native") {
    if (!routeIdRaw || !isValidNativeRouteId(routeIdRaw)) return { error: "Vui lòng chọn route native hợp lệ." };
    routeId = routeIdRaw;
  } else {
    if (!webUrlRaw) return { error: "Vui lòng nhập URL cho webview." };
    if (webUrlRaw.length > 2000) return { error: "URL quá dài." };
    try {
      const u = new URL(webUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") return { error: "URL phải bắt đầu bằng http hoặc https." };
    } catch {
      return { error: "URL không hợp lệ." };
    }
    webUrl = webUrlRaw;
  }

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Vui lòng nhập nhãn hiển thị." };
  if (label.length > 120) return { error: "Nhãn tối đa 120 ký tự." };

  const iconKey = String(formData.get("iconKey") ?? "").trim() || "help_outline";
  if (!isValidAppMobileIconKey(iconKey)) return { error: "Icon không hợp lệ." };

  const useCustomIcon = parseUseCustomIcon(String(formData.get("useCustomIcon") ?? "false"));
  const iconFile = formData.get("iconFile");
  const shouldUploadNew = iconFile instanceof File && iconFile.size > 0;
  let nextIconFileId: string | null = existing.iconFileId ?? null;
  let newIconFileId: string | null = null;
  if (useCustomIcon && shouldUploadNew) {
    const saved = await saveAppHomeIconFile(session, iconFile as File);
    if (!saved.ok) return { error: saved.error };
    newIconFileId = saved.fileId;
    nextIconFileId = newIconFileId;
  } else if (!useCustomIcon) {
    nextIconFileId = null;
  } else {
    if (!nextIconFileId) return { error: "Bạn đã chọn icon tuỳ chỉnh nhưng chưa có icon nào. Vui lòng upload file icon." };
  }

  const accentHex = DEFAULT_ITEM_ACCENT_HEX;

  try {
    await updateAppMobileHomeBannerItemContent(id, {
      kind,
      routeId,
      webUrl,
      label,
      iconKey,
      accentHex,
      iconFileId: nextIconFileId,
    });
  } catch (e) {
    console.error(e);
    if (newIconFileId) await removeBannerFileById(newIconFileId);
    return { error: "Không thể cập nhật." };
  }

  const oldIconFileId = existing.iconFileId ?? null;
  if (oldIconFileId && oldIconFileId !== nextIconFileId) {
    await removeBannerFileById(oldIconFileId);
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

export async function deleteAppMobileHomeBannerItemFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) redirect(CAU_HINH_APP_MENU);
  const id = String(formData.get("itemId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) redirect(CAU_HINH_APP_MENU);
  const existing = await findAppMobileHomeBannerItemById(id);
  if (!existing) redirect(CAU_HINH_APP_MENU);

  try {
    await deleteAppMobileHomeBannerItem(id);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
  redirect(CAU_HINH_APP_MENU);
}

export async function moveAppMobileHomeBannerItemServer(
  itemId: string,
  sectionId: string,
  direction: "up" | "down",
): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(itemId) || !UUID_RE.test(sectionId)) return;
  try {
    await moveAppMobileHomeBannerItemRelative(itemId, sectionId, direction);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function setAppMobileHomeBannerItemActiveServer(id: string, isActive: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileHomeBannerItemActive(id, isActive);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function updateAppMobileSectionAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("sectionId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã nhóm không hợp lệ." };

  const existing = await findAppMobileSectionById(id);
  if (!existing) return { error: "Không tìm thấy nhóm." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Vui lòng nhập tên nhóm." };
  if (title.length > 200) return { error: "Tên nhóm tối đa 200 ký tự." };

  const iconFile = formData.get("iconFile");
  const shouldUploadNew = iconFile instanceof File && iconFile.size > 0;

  let nextIconFileId: string | null = existing.iconFileId ?? null;
  let newIconFileId: string | null = null;
  if (shouldUploadNew) {
    const saved = await saveAppHomeIconFile(session, iconFile as File);
    if (!saved.ok) return { error: saved.error };
    newIconFileId = saved.fileId;
    nextIconFileId = newIconFileId;
  } else if (!nextIconFileId) {
    return { error: "Nhóm chưa có icon. Vui lòng upload icon (SVG) cho nhóm." };
  }

  try {
    await updateAppMobileSectionTitle(id, { title, iconFileId: nextIconFileId });
  } catch (e) {
    console.error(e);
    if (newIconFileId) await removeBannerFileById(newIconFileId);
    return { error: "Không thể cập nhật." };
  }

  const oldIconFileId = existing.iconFileId ?? null;
  if (oldIconFileId && oldIconFileId !== nextIconFileId) {
    await removeBannerFileById(oldIconFileId);
  }

  revalidateCauHinhAppTree();
  revalidatePath(`/cau-hinh-app/nhom-menu/${id}/chinh-sua`);
  return { ok: true };
}

export async function deleteAppMobileSectionFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) {
    redirect(CAU_HINH_APP_MENU);
  }

  const id = String(formData.get("sectionId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) redirect(CAU_HINH_APP_MENU);

  const existing = await findAppMobileSectionById(id);
  if (!existing) redirect(CAU_HINH_APP_MENU);

  try {
    await deleteAppMobileSection(id);
  } catch (e) {
    console.error(e);
  }

  revalidateCauHinhAppTree();
  redirect(CAU_HINH_APP_MENU);
}

function parseItemKind(raw: string): "native" | "webview" | null {
  if (raw === "native" || raw === "webview") return raw;
  return null;
}

function parseHomeBannerItemKind(raw: string): "native" | "webview" | "file" | null {
  if (raw === "native" || raw === "webview" || raw === "file") return raw;
  return null;
}

function parseHomeMenuItemKind(raw: string): "native" | "webview" | "file" | null {
  if (raw === "native" || raw === "webview" || raw === "file") return raw;
  return null;
}

export async function createAppMobileItemAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền thêm." };

  const sectionId = String(formData.get("sectionId") ?? "").trim();
  if (!sectionId || !UUID_RE.test(sectionId)) return { error: "Nhóm menu không hợp lệ." };
  const section = await findAppMobileSectionById(sectionId);
  if (!section) return { error: "Không tìm thấy nhóm menu." };

  const kind = parseHomeMenuItemKind(String(formData.get("kind") ?? ""));
  if (!kind) return { error: "Loại mục không hợp lệ." };

  const routeIdRaw = String(formData.get("routeId") ?? "").trim();
  const webUrlRaw = String(formData.get("webUrl") ?? "").trim();
  const documentUpload = formData.get("documentFile");

  let routeId: string | null = null;
  let webUrl: string | null = null;
  let documentFileId: string | null = null;
  if (kind === "native") {
    if (!routeIdRaw || !isValidNativeRouteId(routeIdRaw)) {
      return { error: "Vui lòng chọn route native hợp lệ." };
    }
    routeId = routeIdRaw;
  } else if (kind === "webview") {
    if (!webUrlRaw) return { error: "Vui lòng nhập URL cho webview." };
    if (webUrlRaw.length > 2000) return { error: "URL quá dài." };
    try {
      const u = new URL(webUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { error: "URL phải bắt đầu bằng http hoặc https." };
      }
    } catch {
      return { error: "URL không hợp lệ." };
    }
    webUrl = webUrlRaw;
  } else {
    if (!(documentUpload instanceof File) || documentUpload.size === 0) {
      return { error: "Chọn tệp PDF, Word hoặc Excel." };
    }
    const savedDoc = await saveAppHomeMenuDocumentFile(session, documentUpload);
    if (!savedDoc.ok) return { error: savedDoc.error };
    documentFileId = savedDoc.fileId;
  }

  console.log("kind", kind);

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Vui lòng nhập nhãn hiển thị." };
  if (label.length > 120) return { error: "Nhãn tối đa 120 ký tự." };

  const iconKey = String(formData.get("iconKey") ?? "").trim() || "help_outline";
  if (!isValidAppMobileIconKey(iconKey)) return { error: "Icon không hợp lệ." };

  const useCustomIcon = parseUseCustomIcon(String(formData.get("useCustomIcon") ?? "false"));
  const iconFile = formData.get("iconFile");
  let iconFileId: string | null = null;
  if (useCustomIcon) {
    if (!(iconFile instanceof File) || iconFile.size === 0) {
      return { error: "Vui lòng chọn file icon tuỳ chỉnh." };
    }
    const saved = await saveAppHomeIconFile(session, iconFile);
    if (!saved.ok) return { error: saved.error };
    iconFileId = saved.fileId;
  }
  const accentHex = DEFAULT_ITEM_ACCENT_HEX;

  const sortOrder = await nextAppMobileItemSortOrderInSection(sectionId);

  try {
    await insertAppMobileItem({
      sectionId,
      kind,
      routeId,
      webUrl,
      documentFileId,
      label,
      iconKey,
      iconFileId,
      accentHex,
      sortOrder,
      isActive: true,
    });
  } catch (e) {
    console.error(e);
    if (iconFileId) {
      await removeBannerFileById(iconFileId);
    }
    if (documentFileId) {
      await removeBannerFileById(documentFileId);
    }
    return { error: "Không thể thêm mục." };
  }

  revalidateCauHinhAppTree();
  return { ok: true };
}

export async function updateAppMobileItemAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("itemId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã mục không hợp lệ." };

  const existing = await findAppMobileItemById(id);
  if (!existing) return { error: "Không tìm thấy mục." };

  const kind = parseHomeMenuItemKind(String(formData.get("kind") ?? ""));
  if (!kind) return { error: "Loại mục không hợp lệ." };

  const routeIdRaw = String(formData.get("routeId") ?? "").trim();
  const webUrlRaw = String(formData.get("webUrl") ?? "").trim();
  const documentUpload = formData.get("documentFile");

  let routeId: string | null = null;
  let webUrl: string | null = null;
  let documentFileId: string | null = existing.documentFileId ?? null;
  if (kind === "native") {
    if (!routeIdRaw || !isValidNativeRouteId(routeIdRaw)) {
      return { error: "Vui lòng chọn route native hợp lệ." };
    }
    routeId = routeIdRaw;
    documentFileId = null;
  } else if (kind === "webview") {
    if (!webUrlRaw) return { error: "Vui lòng nhập URL cho webview." };
    if (webUrlRaw.length > 2000) return { error: "URL quá dài." };
    try {
      const u = new URL(webUrlRaw);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { error: "URL phải bắt đầu bằng http hoặc https." };
      }
    } catch {
      return { error: "URL không hợp lệ." };
    }
    webUrl = webUrlRaw;
    documentFileId = null;
  } else {
    routeId = null;
    webUrl = null;
    const shouldUploadDoc = documentUpload instanceof File && documentUpload.size > 0;
    if (shouldUploadDoc) {
      const savedDoc = await saveAppHomeMenuDocumentFile(session, documentUpload as File);
      if (!savedDoc.ok) return { error: savedDoc.error };
      documentFileId = savedDoc.fileId;
    } else if (!documentFileId) {
      return { error: "Chọn tệp PDF, Word hoặc Excel." };
    }
  }

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Vui lòng nhập nhãn hiển thị." };
  if (label.length > 120) return { error: "Nhãn tối đa 120 ký tự." };

  const iconKey = String(formData.get("iconKey") ?? "").trim() || "help_outline";
  if (!isValidAppMobileIconKey(iconKey)) return { error: "Icon không hợp lệ." };

  const useCustomIcon = parseUseCustomIcon(String(formData.get("useCustomIcon") ?? "false"));
  const iconFile = formData.get("iconFile");
  const shouldUploadNew = iconFile instanceof File && iconFile.size > 0;

  let nextIconFileId: string | null = existing.iconFileId ?? null;
  let newIconFileId: string | null = null;
  if (useCustomIcon && shouldUploadNew) {
    const saved = await saveAppHomeIconFile(session, iconFile as File);
    if (!saved.ok) return { error: saved.error };
    newIconFileId = saved.fileId;
    nextIconFileId = newIconFileId;
  } else if (!useCustomIcon) {
    nextIconFileId = null;
  } else {
    // useCustomIcon=true but no new file: keep existing if any
    if (!nextIconFileId) {
      return { error: "Bạn đã chọn icon tuỳ chỉnh nhưng chưa có icon nào. Vui lòng upload file icon." };
    }
  }
  const accentHex = DEFAULT_ITEM_ACCENT_HEX;

  const oldDocumentFileId = existing.documentFileId ?? null;
  let newDocumentFileId: string | null = null;
  if (kind === "file" && documentUpload instanceof File && documentUpload.size > 0) {
    newDocumentFileId = documentFileId;
  }

  console.log("kind", kind);

  try {
    await updateAppMobileItemContent(id, {
      kind,
      routeId,
      webUrl,
      documentFileId,
      label,
      iconKey,
      accentHex,
      iconFileId: nextIconFileId,
    });
  } catch (e) {
    console.error(e);
    if (newIconFileId) await removeBannerFileById(newIconFileId);
    if (newDocumentFileId) await removeBannerFileById(newDocumentFileId);
    return { error: "Không thể cập nhật." };
  }

  // Cleanup old icon file if replaced or removed
  const oldIconFileId = existing.iconFileId ?? null;
  if (oldIconFileId && oldIconFileId !== nextIconFileId) {
    await removeBannerFileById(oldIconFileId);
  }
  if (oldDocumentFileId && oldDocumentFileId !== documentFileId) {
    await removeBannerFileById(oldDocumentFileId);
  }

  revalidateCauHinhAppTree();
  revalidatePath(`/cau-hinh-app/muc/${id}/chinh-sua`);
  return { ok: true };
}

export async function deleteAppMobileItemFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) {
    redirect(CAU_HINH_APP_MENU);
  }

  const id = String(formData.get("itemId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) redirect(CAU_HINH_APP_MENU);

  const existing = await findAppMobileItemById(id);
  if (!existing) redirect(CAU_HINH_APP_MENU);

  const docId = existing.documentFileId ?? null;
  try {
    await deleteAppMobileItem(id);
  } catch (e) {
    console.error(e);
  }
  if (docId) await removeBannerFileById(docId);

  revalidateCauHinhAppTree();
  redirect(CAU_HINH_APP_MENU);
}

export async function moveAppMobileSectionServer(id: string, direction: "up" | "down"): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await moveAppMobileSectionRelative(id, direction);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function moveAppMobileItemServer(
  itemId: string,
  sectionId: string,
  direction: "up" | "down",
): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(itemId) || !UUID_RE.test(sectionId)) return;
  try {
    await moveAppMobileItemRelative(itemId, sectionId, direction);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function moveAppMobileBannerServer(
  id: string,
  placement: AppHomeBannerPlacement,
  direction: "up" | "down",
): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await moveAppMobileBannerRelative(id, placement, direction);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function setAppMobileSectionActiveServer(id: string, isActive: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileSectionActive(id, isActive);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function setAppMobileItemActiveServer(id: string, isActive: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileItemActive(id, isActive);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function setAppMobileItemDefaultFavoriteServer(id: string, isDefaultFavorite: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileItemDefaultFavorite(id, isDefaultFavorite);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function setAppMobileBannerActiveServer(id: string, isActive: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileBannerActive(id, isActive);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}

export async function setAppMobileShellTabActiveServer(id: string, isActive: boolean): Promise<{ ok?: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return { error: "Không có quyền." };
  if (!UUID_RE.test(id)) return { error: "Mã tab không hợp lệ." };
  try {
    await setAppMobileShellTabActive(id, isActive);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Không cập nhật được.";
    return { error: msg };
  }
  revalidateCauHinhAppTree();
  return { ok: true };
}

export async function moveAppMobileShellTabServer(id: string, direction: "up" | "down"): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!UUID_RE.test(id)) return;
  try {
    await moveAppMobileShellTabRelative(id, direction);
  } catch (e) {
    console.error(e);
  }
  revalidateCauHinhAppTree();
}
