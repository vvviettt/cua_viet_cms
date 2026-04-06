"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  deletePublicHotline,
  findPublicHotlineById,
  insertPublicHotline,
  updatePublicHotline,
} from "@/lib/db/public-hotlines";
import { canEditContent } from "@/lib/roles";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type PublicHotlineFormState = { ok?: boolean; error?: string };

function parseSortOrder(raw: string): number {
  const n = parseInt(raw.trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

export async function createPublicHotlineEntry(
  _prev: PublicHotlineFormState,
  formData: FormData,
): Promise<PublicHotlineFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền thêm." };

  const serviceName = String(formData.get("serviceName") ?? "").trim();
  if (!serviceName) return { error: "Vui lòng nhập tên dịch vụ / bộ phận." };
  if (serviceName.length > 200) return { error: "Tên tối đa 200 ký tự." };

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return { error: "Vui lòng nhập số điện thoại." };
  if (phone.length > 40) return { error: "Số điện thoại tối đa 40 ký tự." };

  const noteRaw = String(formData.get("note") ?? "").trim();
  if (noteRaw.length > 500) return { error: "Ghi chú tối đa 500 ký tự." };
  const note = noteRaw ? noteRaw : null;

  const sortOrder = parseSortOrder(String(formData.get("sortOrder") ?? "0"));
  const isActive = formData.get("isActive") === "on";

  try {
    await insertPublicHotline({ serviceName, phone, note, sortOrder, isActive });
  } catch (e) {
    console.error(e);
    return { error: "Không thể lưu. Thử lại sau." };
  }

  revalidatePath("/duong-day-nong");
  return { ok: true };
}

export async function updatePublicHotlineEntry(
  _prev: PublicHotlineFormState,
  formData: FormData,
): Promise<PublicHotlineFormState> {
  const session = await getSession();
  if (!session) return { error: "Phiên đăng nhập không hợp lệ." };
  if (!canEditContent(session.role)) return { error: "Bạn không có quyền cập nhật." };

  const id = String(formData.get("hotlineId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) return { error: "Mã bản ghi không hợp lệ." };

  const existing = await findPublicHotlineById(id);
  if (!existing) return { error: "Không tìm thấy bản ghi." };

  const serviceName = String(formData.get("serviceName") ?? "").trim();
  if (!serviceName) return { error: "Vui lòng nhập tên dịch vụ / bộ phận." };
  if (serviceName.length > 200) return { error: "Tên tối đa 200 ký tự." };

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return { error: "Vui lòng nhập số điện thoại." };
  if (phone.length > 40) return { error: "Số điện thoại tối đa 40 ký tự." };

  const noteRaw = String(formData.get("note") ?? "").trim();
  if (noteRaw.length > 500) return { error: "Ghi chú tối đa 500 ký tự." };
  const note = noteRaw ? noteRaw : null;

  const sortOrder = parseSortOrder(String(formData.get("sortOrder") ?? "0"));
  const isActive = formData.get("isActive") === "on";

  try {
    await updatePublicHotline(id, { serviceName, phone, note, sortOrder, isActive });
  } catch (e) {
    console.error(e);
    return { error: "Không thể cập nhật. Thử lại sau." };
  }

  revalidatePath("/duong-day-nong");
  revalidatePath(`/duong-day-nong/${id}/chinh-sua`);
  return { ok: true };
}

/** Form `<form action={…}>` — chữ ký một tham số (không dùng useActionState). */
export async function deletePublicHotlineFormAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !canEditContent(session.role)) {
    redirect("/duong-day-nong");
  }

  const id = String(formData.get("hotlineId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) {
    redirect("/duong-day-nong");
  }

  const existing = await findPublicHotlineById(id);
  if (!existing) {
    redirect("/duong-day-nong");
  }

  try {
    await deletePublicHotline(id);
  } catch (e) {
    console.error(e);
  }

  revalidatePath("/duong-day-nong");
  redirect("/duong-day-nong");
}
