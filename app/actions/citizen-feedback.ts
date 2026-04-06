"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import type { CitizenFeedbackStatus } from "@/lib/citizen-feedback/types";
import {
  findCitizenFeedbackById,
  updateCitizenFeedbackAdminFields,
  updateCitizenFeedbackStaffReply,
} from "@/lib/db/citizen-feedback";
import { canEditContent } from "@/lib/roles";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUSES: CitizenFeedbackStatus[] = ["received", "processing", "answered", "closed"];

function isStatus(v: string): v is CitizenFeedbackStatus {
  return (STATUSES as readonly string[]).includes(v);
}

export type CitizenFeedbackFormState = { ok?: boolean; error?: string };

export async function updateCitizenFeedbackEntry(
  _prev: CitizenFeedbackFormState,
  formData: FormData,
): Promise<CitizenFeedbackFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) {
    return { error: "Bạn không có quyền cập nhật." };
  }

  const id = String(formData.get("feedbackId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã bản ghi không hợp lệ." };

  const existing = await findCitizenFeedbackById(id);
  if (!existing) return { error: "Không tìm thấy bản ghi." };

  const statusRaw = String(formData.get("status") ?? "").trim();
  if (!isStatus(statusRaw)) return { error: "Trạng thái không hợp lệ." };

  const noteRaw = String(formData.get("adminNote") ?? "").trim();
  const adminNote = noteRaw ? noteRaw.slice(0, 10_000) : null;
  const hiddenFromApp = formData.get("hiddenFromApp") === "on";

  try {
    await updateCitizenFeedbackAdminFields(id, {
      status: statusRaw,
      adminNote,
      hiddenFromApp,
      ...(statusRaw === "answered"
        ? { answeredByUserId: session.userId }
        : statusRaw === "received" || statusRaw === "processing"
          ? { answeredByUserId: null }
          : {}),
    });
  } catch (e) {
    console.error(e);
    return { error: "Không thể cập nhật. Thử lại sau." };
  }

  revalidatePath("/phan-anh-kien-nghi");
  revalidatePath(`/phan-anh-kien-nghi/${id}`);
  return { ok: true };
}

const STAFF_REPLY_MAX = 20_000;

export async function saveCitizenFeedbackStaffReply(
  _prev: CitizenFeedbackFormState,
  formData: FormData,
): Promise<CitizenFeedbackFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) {
    return { error: "Bạn không có quyền gửi trả lời." };
  }

  const id = String(formData.get("feedbackId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã bản ghi không hợp lệ." };

  const existing = await findCitizenFeedbackById(id);
  if (!existing) return { error: "Không tìm thấy bản ghi." };

  const raw = String(formData.get("staffReply") ?? "");
  const trimmed = raw.trim();
  if (trimmed.length > STAFF_REPLY_MAX) {
    return { error: `Nội dung trả lời tối đa ${STAFF_REPLY_MAX.toLocaleString("vi-VN")} ký tự.` };
  }
  const staffReply = trimmed.length > 0 ? trimmed : null;

  try {
    await updateCitizenFeedbackStaffReply(id, { staffReply });
  } catch (e) {
    console.error(e);
    return { error: "Không thể lưu trả lời. Thử lại sau." };
  }

  revalidatePath("/phan-anh-kien-nghi");
  revalidatePath(`/phan-anh-kien-nghi/${id}`);
  return { ok: true };
}
