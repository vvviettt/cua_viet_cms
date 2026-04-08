"use server";

import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session-cookie";
import { isValidAppMobileIconKey } from "@/lib/app-mobile-icon-keys";
import { isValidNativeRouteId } from "@/lib/app-mobile-native-routes";
import { deleteFileRecordById, findFileById, insertUploadedFile } from "@/lib/db/file-records";
import {
  deleteAppMobileBannerRow,
  deleteAppMobileItem,
  deleteAppMobileSection,
  ensureAppMobileThemeRow,
  findAppMobileBannerById,
  findAppMobileItemById,
  findAppMobileSectionById,
  insertAppMobileBanner,
  insertAppMobileItem,
  insertAppMobileSection,
  moveAppMobileBannerRelative,
  moveAppMobileItemRelative,
  moveAppMobileSectionRelative,
  nextAppMobileBannerSortOrder,
  nextAppMobileItemSortOrderInSection,
  nextAppMobileSectionSortOrder,
  setAppMobileBannerActive,
  setAppMobileItemActive,
  setAppMobileSectionActive,
  updateAppMobileItemContent,
  updateAppMobileSectionTitle,
  updateAppMobileTheme,
} from "@/lib/db/app-mobile-config";
import { canEditContent } from "@/lib/roles";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const HEX6_RE = /^#[0-9A-Fa-f]{6}$/;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "app-home");
const MAX_BANNER_BYTES = 8 * 1024 * 1024;
const RELATIVE_PREFIX = "app-home";

/** Trang cấu hình app — giữ ?tab= để đúng tab sau redirect/back */
const CAU_HINH_APP_MENU = "/cau-hinh-app?tab=menu";
const CAU_HINH_APP_BANNER = "/cau-hinh-app?tab=banner";

export type AppMobileFormState = { ok?: boolean; error?: string };

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

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `banner-${randomUUID()}.${parsed.ext}`;
  const diskPath = path.join(UPLOAD_DIR, fileName);
  const relativePath = `${RELATIVE_PREFIX}/${fileName}`;

  await writeFile(diskPath, buf);

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
    try {
      await unlink(diskPath);
    } catch {
      /* ignore */
    }
    return { ok: false, error: "Không thể lưu file. Thử lại sau." };
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

export async function updateAppMobileThemeAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền cập nhật." };

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

  revalidatePath("/cau-hinh-app");
  return { ok: true };
}

export async function createAppMobileBannerAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền thêm." };

  const file = formData.get("banner");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vui lòng chọn ảnh banner." };
  }

  const saved = await saveAppHomeBannerFile(session, file);
  if (!saved.ok) return { error: saved.error };

  const sortOrder = await nextAppMobileBannerSortOrder();

  try {
    await insertAppMobileBanner({ fileId: saved.fileId, sortOrder, isActive: true });
  } catch (e) {
    console.error(e);
    await removeBannerFileById(saved.fileId);
    return { error: "Không thể lưu banner." };
  }

  revalidatePath("/cau-hinh-app");
  return { ok: true };
}

export async function deleteAppMobileBannerFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) {
    redirect(CAU_HINH_APP_BANNER);
  }

  const id = String(formData.get("bannerId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) redirect(CAU_HINH_APP_BANNER);

  const existing = await findAppMobileBannerById(id);
  if (!existing) redirect(CAU_HINH_APP_BANNER);

  const fileId = existing.banner.fileId;
  try {
    await deleteAppMobileBannerRow(id);
  } catch (e) {
    console.error(e);
    redirect(CAU_HINH_APP_BANNER);
  }

  await removeBannerFileById(fileId);
  revalidatePath("/cau-hinh-app");
  redirect(CAU_HINH_APP_BANNER);
}

export async function createAppMobileSectionAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền thêm." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Vui lòng nhập tên nhóm." };
  if (title.length > 200) return { error: "Tên nhóm tối đa 200 ký tự." };

  const sortOrder = await nextAppMobileSectionSortOrder();

  try {
    await insertAppMobileSection({ title, sortOrder, isActive: true });
  } catch (e) {
    console.error(e);
    return { error: "Không thể thêm nhóm." };
  }

  revalidatePath("/cau-hinh-app");
  return { ok: true };
}

export async function updateAppMobileSectionAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("sectionId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã nhóm không hợp lệ." };

  const existing = await findAppMobileSectionById(id);
  if (!existing) return { error: "Không tìm thấy nhóm." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Vui lòng nhập tên nhóm." };
  if (title.length > 200) return { error: "Tên nhóm tối đa 200 ký tự." };

  try {
    await updateAppMobileSectionTitle(id, title);
  } catch (e) {
    console.error(e);
    return { error: "Không thể cập nhật." };
  }

  revalidatePath("/cau-hinh-app");
  revalidatePath(`/cau-hinh-app/nhom-menu/${id}/chinh-sua`);
  return { ok: true };
}

export async function deleteAppMobileSectionFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) {
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

  revalidatePath("/cau-hinh-app");
  redirect(CAU_HINH_APP_MENU);
}

function parseItemKind(raw: string): "native" | "webview" | null {
  if (raw === "native" || raw === "webview") return raw;
  return null;
}

export async function createAppMobileItemAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền thêm." };

  const sectionId = String(formData.get("sectionId") ?? "").trim();
  if (!sectionId || !UUID_RE.test(sectionId)) return { error: "Nhóm menu không hợp lệ." };
  const section = await findAppMobileSectionById(sectionId);
  if (!section) return { error: "Không tìm thấy nhóm menu." };

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

  const accentHex = String(formData.get("accentHex") ?? "").trim();
  if (!HEX6_RE.test(accentHex)) {
    return { error: "Màu nhấn phải là #RRGGBB." };
  }

  const sortOrder = await nextAppMobileItemSortOrderInSection(sectionId);

  try {
    await insertAppMobileItem({
      sectionId,
      kind,
      routeId,
      webUrl,
      label,
      iconKey,
      accentHex,
      sortOrder,
      isActive: true,
    });
  } catch (e) {
    console.error(e);
    return { error: "Không thể thêm mục." };
  }

  revalidatePath("/cau-hinh-app");
  return { ok: true };
}

export async function updateAppMobileItemAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("itemId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã mục không hợp lệ." };

  const existing = await findAppMobileItemById(id);
  if (!existing) return { error: "Không tìm thấy mục." };

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

  const accentHex = String(formData.get("accentHex") ?? "").trim();
  if (!HEX6_RE.test(accentHex)) {
    return { error: "Màu nhấn phải là #RRGGBB." };
  }

  try {
    await updateAppMobileItemContent(id, {
      kind,
      routeId,
      webUrl,
      label,
      iconKey,
      accentHex,
    });
  } catch (e) {
    console.error(e);
    return { error: "Không thể cập nhật." };
  }

  revalidatePath("/cau-hinh-app");
  revalidatePath(`/cau-hinh-app/muc/${id}/chinh-sua`);
  return { ok: true };
}

export async function deleteAppMobileItemFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) {
    redirect(CAU_HINH_APP_MENU);
  }

  const id = String(formData.get("itemId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) redirect(CAU_HINH_APP_MENU);

  const existing = await findAppMobileItemById(id);
  if (!existing) redirect(CAU_HINH_APP_MENU);

  try {
    await deleteAppMobileItem(id);
  } catch (e) {
    console.error(e);
  }

  revalidatePath("/cau-hinh-app");
  redirect(CAU_HINH_APP_MENU);
}

export async function moveAppMobileSectionServer(id: string, direction: "up" | "down"): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) return;
  if (!UUID_RE.test(id)) return;
  try {
    await moveAppMobileSectionRelative(id, direction);
  } catch (e) {
    console.error(e);
  }
  revalidatePath("/cau-hinh-app");
}

export async function moveAppMobileItemServer(
  itemId: string,
  sectionId: string,
  direction: "up" | "down",
): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) return;
  if (!UUID_RE.test(itemId) || !UUID_RE.test(sectionId)) return;
  try {
    await moveAppMobileItemRelative(itemId, sectionId, direction);
  } catch (e) {
    console.error(e);
  }
  revalidatePath("/cau-hinh-app");
}

export async function moveAppMobileBannerServer(id: string, direction: "up" | "down"): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) return;
  if (!UUID_RE.test(id)) return;
  try {
    await moveAppMobileBannerRelative(id, direction);
  } catch (e) {
    console.error(e);
  }
  revalidatePath("/cau-hinh-app");
}

export async function setAppMobileSectionActiveServer(id: string, isActive: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileSectionActive(id, isActive);
  } catch (e) {
    console.error(e);
  }
  revalidatePath("/cau-hinh-app");
}

export async function setAppMobileItemActiveServer(id: string, isActive: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileItemActive(id, isActive);
  } catch (e) {
    console.error(e);
  }
  revalidatePath("/cau-hinh-app");
}

export async function setAppMobileBannerActiveServer(id: string, isActive: boolean): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) return;
  if (!UUID_RE.test(id)) return;
  try {
    await setAppMobileBannerActive(id, isActive);
  } catch (e) {
    console.error(e);
  }
  revalidatePath("/cau-hinh-app");
}
