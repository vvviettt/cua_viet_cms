"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";
import { sessionCanEditModule } from "@/lib/cms-module-access";
import {
  deleteAppMobileFaq,
  ensureAppMobileSettingsRow,
  insertAppMobileFaq,
  moveAppMobileFaqRelative,
  nextAppMobileFaqSortOrder,
  updateAppMobileFaq,
  updateAppMobileSettings,
} from "@/lib/db/app-mobile-settings";

import type { AppMobileFormState } from "./app-mobile-config";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function revalidateAppSettings() {
  revalidatePath(appMobileCauHinhPaths.caiDat);
  revalidatePath(appMobileCauHinhPaths.hub, "layout");
  revalidatePath("/api/public/app-config");
}

function normalizeDigits(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export async function updateAppMobileSettingsAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  await ensureAppMobileSettingsRow();

  const allowCitizenRegister = String(formData.get("allowCitizenRegister") ?? "") === "true";

  const hotlineRaw = String(formData.get("supportHotline") ?? "").trim();
  const hotlineDigits = hotlineRaw ? normalizeDigits(hotlineRaw) : "";
  if (hotlineRaw && !hotlineDigits) return { error: "Hotline không hợp lệ." };
  if (hotlineDigits.length > 20) return { error: "Hotline quá dài." };

  const usageGuideJson = String(formData.get("usageGuideJson") ?? "").trim() || '{"blocks":[]}';
  const termsJson = String(formData.get("termsJson") ?? "").trim() || '{"blocks":[]}';

  try {
    await updateAppMobileSettings({
      allowCitizenRegister,
      supportHotline: hotlineDigits ? hotlineDigits : null,
      usageGuideJson,
      termsJson,
    });
  } catch (e) {
    console.error(e);
    return { error: "Không thể lưu. Thử lại sau." };
  }

  revalidateAppSettings();
  return { ok: true };
}

export async function createAppMobileFaqAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền thêm." };

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!question) return { error: "Thiếu câu hỏi." };
  if (question.length > 300) return { error: "Câu hỏi quá dài." };
  if (!answer) return { error: "Thiếu trả lời." };
  if (answer.length > 4000) return { error: "Trả lời quá dài." };

  try {
    const sortOrder = await nextAppMobileFaqSortOrder();
    await insertAppMobileFaq({ question, answer, isActive, sortOrder });
  } catch (e) {
    console.error(e);
    return { error: "Không thể thêm câu hỏi." };
  }

  revalidateAppSettings();
  return { ok: true };
}

export async function updateAppMobileFaqAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã câu hỏi không hợp lệ." };

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const isActive = String(formData.get("isActive") ?? "true") === "true";

  if (!question) return { error: "Thiếu câu hỏi." };
  if (question.length > 300) return { error: "Câu hỏi quá dài." };
  if (!answer) return { error: "Thiếu trả lời." };
  if (answer.length > 4000) return { error: "Trả lời quá dài." };

  try {
    await updateAppMobileFaq(id, { question, answer, isActive });
  } catch (e) {
    console.error(e);
    return { error: "Không thể cập nhật." };
  }

  revalidateAppSettings();
  return { ok: true };
}

export async function deleteAppMobileFaqServer(id: string): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!id || !UUID_RE.test(id)) return;
  try {
    await deleteAppMobileFaq(id);
  } catch (e) {
    console.error(e);
  }
  revalidateAppSettings();
}

export async function moveAppMobileFaqServer(id: string, direction: "up" | "down"): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!id || !UUID_RE.test(id)) return;
  try {
    await moveAppMobileFaqRelative(id, direction);
  } catch (e) {
    console.error(e);
  }
  revalidateAppSettings();
}

