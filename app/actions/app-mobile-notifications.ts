"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { appMobileCauHinhPaths } from "@/lib/app-mobile-cau-hinh-paths";
import {
  isAppMobileNotificationCategory,
  type AppMobileNotificationCategory,
} from "@/lib/app-mobile-notifications/constants";
import { sessionCanEditModule } from "@/lib/cms-module-access";
import {
  deleteAppMobileNotification,
  findAppMobileNotificationById,
  insertAppMobileNotification,
  markAppMobileNotificationSent,
  updateAppMobileNotification,
} from "@/lib/db/app-mobile-notifications";
import { logNotification, logNotificationError } from "@/lib/log/notification-log";
import { pushNotificationToUsers } from "@/lib/notifications/push-notification";

import type { AppMobileFormState } from "./app-mobile-config";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function revalidateNotifications() {
  revalidatePath(appMobileCauHinhPaths.thongBao);
  revalidatePath(appMobileCauHinhPaths.hub, "layout");
  revalidatePath("/api/public/notifications");
}

function parseCategory(formData: FormData): AppMobileNotificationCategory | null {
  const v = String(formData.get("category") ?? "").trim();
  return isAppMobileNotificationCategory(v) ? v : null;
}

async function pushAndMarkSent(
  id: string,
  row: Awaited<ReturnType<typeof findAppMobileNotificationById>>,
): Promise<AppMobileFormState> {
  if (!row) return { error: "Không tìm thấy thông báo." };
  if (row.sentAt) return { error: "Thông báo đã được gửi trước đó." };

  logNotification("publish:start", {
    id,
    title: row.title,
    category: row.category,
  });

  try {
    await markAppMobileNotificationSent(id);
    logNotification("publish:marked-sent", { id });
  } catch (e) {
    logNotificationError("publish:mark-sent-failed", { id }, e);
    return { error: "Không thể đăng thông báo lên app. Thử lại sau." };
  }

  try {
    const result = await pushNotificationToUsers({
      id: row.id,
      category: row.category,
      title: row.title,
      content: row.content,
    });
    logNotification("publish:push-done", {
      id,
      success: result.success,
      mode: result.mode,
      recipientCount: result.recipientCount,
      failureCount: result.failureCount,
    });
    if (!result.success) {
      logNotificationError("publish:push-failed-still-visible-in-app", {
        id,
        hint: "Thông báo đã có sentAt — app vẫn thấy trong danh sách; kiểm tra Firebase / token FCM.",
      });
    }
  } catch (e) {
    logNotificationError("publish:push-exception-still-visible-in-app", { id }, e);
  }

  revalidateNotifications();
  return { ok: true };
}

export async function createAppMobileNotificationAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền thêm." };

  const category = parseCategory(formData);
  if (!category) return { error: "Loại thông báo không hợp lệ." };

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title) return { error: "Thiếu tiêu đề." };
  if (title.length > 300) return { error: "Tiêu đề quá dài." };
  if (!content) return { error: "Thiếu nội dung." };
  if (content.length > 8000) return { error: "Nội dung quá dài." };

  const deferSend = String(formData.get("deferSend") ?? "") === "true";

  let id: string;
  try {
    id = await insertAppMobileNotification({
      category,
      title,
      content,
      sentAt: null,
    });
    logNotification("create:inserted", { id, title, deferSend });
  } catch (e) {
    logNotificationError("create:insert-failed", { title }, e);
    return { error: "Không thể thêm thông báo." };
  }

  if (!deferSend) {
    const row = await findAppMobileNotificationById(id);
    const pushResult = await pushAndMarkSent(id, row);
    if (!pushResult.ok) return pushResult;
  } else {
    logNotification("create:deferred", {
      id,
      hint: "Chưa có sentAt — app không hiện cho đến khi bấm Gửi đến người dùng.",
    });
  }

  revalidateNotifications();
  return { ok: true };
}

export async function updateAppMobileNotificationAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã thông báo không hợp lệ." };

  const existing = await findAppMobileNotificationById(id);
  if (!existing) return { error: "Không tìm thấy thông báo." };

  const category = parseCategory(formData);
  if (!category) return { error: "Loại thông báo không hợp lệ." };

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title) return { error: "Thiếu tiêu đề." };
  if (title.length > 300) return { error: "Tiêu đề quá dài." };
  if (!content) return { error: "Thiếu nội dung." };
  if (content.length > 8000) return { error: "Nội dung quá dài." };

  try {
    await updateAppMobileNotification(id, { category, title, content });
  } catch (e) {
    console.error(e);
    return { error: "Không thể cập nhật." };
  }

  revalidateNotifications();
  return { ok: true };
}

export async function sendAppMobileNotificationAction(
  _prev: AppMobileFormState,
  formData: FormData,
): Promise<AppMobileFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!(await sessionCanEditModule(session, "app_mobile"))) return { error: "Bạn không có quyền gửi." };

  const id = String(formData.get("id") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã thông báo không hợp lệ." };

  const row = await findAppMobileNotificationById(id);
  return pushAndMarkSent(id, row);
}

export async function deleteAppMobileNotificationServer(id: string): Promise<void> {
  const session = await getSession();
  if (!session || !(await sessionCanEditModule(session, "app_mobile"))) return;
  if (!id || !UUID_RE.test(id)) return;

  try {
    await deleteAppMobileNotification(id);
  } catch (e) {
    console.error(e);
  }
  revalidateNotifications();
}
