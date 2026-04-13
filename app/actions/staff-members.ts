"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import type { SessionPayload } from "@/lib/session-cookie";
import { insertUploadedFile } from "@/lib/db/file-records";
import { removeSupabaseObject, uploadBufferToSupabase } from "@/lib/uploads/supabase-storage";
import {
  findStaffMemberById,
  insertStaffMember,
  updateStaffMemberById,
} from "@/lib/db/staff-members";
import { canEditContent } from "@/lib/roles";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const RELATIVE_PREFIX = "can-bo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CreateStaffFormState = { ok?: boolean; error?: string };

export type UpdateStaffFormState = { ok?: boolean; error?: string };

type ParsedStaffFields = {
  fullName: string;
  jobTitle: string;
  dateOfBirth: string | null;
  contactEmail: string | null;
  sortOrder: number;
  isActive: boolean;
};

function parseStaffFormData(
  formData: FormData,
): { ok: true; data: ParsedStaffFields } | { ok: false; error: string } {
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) {
    return { ok: false, error: "Vui lòng nhập họ và tên." };
  }
  if (fullName.length > 200) {
    return { ok: false, error: "Họ và tên tối đa 200 ký tự." };
  }

  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  if (!jobTitle) {
    return { ok: false, error: "Vui lòng nhập chức vụ." };
  }
  if (jobTitle.length > 200) {
    return { ok: false, error: "Chức vụ tối đa 200 ký tự." };
  }

  const dobRaw = String(formData.get("dateOfBirth") ?? "").trim();
  let dateOfBirth: string | null = null;
  if (dobRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) {
      return { ok: false, error: "Ngày sinh không hợp lệ." };
    }
    dateOfBirth = dobRaw;
  }

  const contactEmailRaw = String(formData.get("contactEmail") ?? "").trim();
  let contactEmail: string | null = null;
  if (contactEmailRaw) {
    if (!EMAIL_RE.test(contactEmailRaw) || contactEmailRaw.length > 320) {
      return { ok: false, error: "Email liên hệ không hợp lệ." };
    }
    contactEmail = contactEmailRaw.toLowerCase();
  }

  const sortRaw = String(formData.get("sortOrder") ?? "").trim();
  let sortOrder = 0;
  if (sortRaw) {
    const n = parseInt(sortRaw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 999_999) {
      return { ok: false, error: "Thứ tự hiển thị phải từ 0 đến 999999." };
    }
    sortOrder = n;
  }

  const isActive = formData.get("isInactive") !== "on";

  return {
    ok: true,
    data: {
      fullName,
      jobTitle,
      dateOfBirth,
      contactEmail,
      sortOrder,
      isActive,
    },
  };
}

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

async function saveAvatarIfAny(
  session: SessionPayload,
  file: File,
): Promise<{ ok: true; relativePath: string } | { ok: false; error: string }> {
  const nameLower = file.name.toLowerCase();
  const parsed = extFromUpload(file, nameLower);
  if (!parsed) {
    return { ok: false, error: "Ảnh đại diện chỉ nhận JPG, PNG, WEBP hoặc GIF." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Ảnh đại diện tối đa 5MB." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length < 10) {
    return { ok: false, error: "File ảnh không hợp lệ." };
  }

  const fileName = `avatar-${randomUUID()}.${parsed.ext}`;
  const relativePath = `${RELATIVE_PREFIX}/${fileName}`;

  await uploadBufferToSupabase({
    relativePath,
    buf,
    contentType: parsed.mime,
    cacheControl: "3600",
    upsert: false,
  });

  try {
    await insertUploadedFile({
      category: "other",
      relativePath,
      originalName: file.name,
      mimeType: parsed.mime,
      sizeBytes: buf.length,
      uploadedById: session.userId,
    });
  } catch {
    return { ok: false, error: "Không thể lưu bản ghi file. Thử lại sau." };
  }

  return { ok: true, relativePath };
}

export async function createStaffMember(
  _prev: CreateStaffFormState,
  formData: FormData,
): Promise<CreateStaffFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canEditContent(session.role)) {
    return { error: "Tài khoản của bạn không có quyền thêm cán bộ." };
  }

  const parsed = parseStaffFormData(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const { fullName, jobTitle, dateOfBirth, contactEmail, sortOrder, isActive } = parsed.data;

  const file = formData.get("avatar");
  let avatarRelativePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    const saved = await saveAvatarIfAny(session, file);
    if (!saved.ok) {
      return { error: saved.error };
    }
    avatarRelativePath = saved.relativePath;
  }

  try {
    await insertStaffMember({
      fullName,
      dateOfBirth,
      jobTitle,
      avatarRelativePath,
      contactEmail,
      sortOrder,
      isActive,
    });
  } catch (e) {
    console.error(e);
    if (avatarRelativePath) {
      try {
        await removeSupabaseObject(avatarRelativePath);
      } catch {
        /* ignore */
      }
    }
    return { error: "Không thể lưu cán bộ. Thử lại sau." };
  }

  revalidatePath("/can-bo");
  return { ok: true };
}

export async function updateStaffMember(
  _prev: UpdateStaffFormState,
  formData: FormData,
): Promise<UpdateStaffFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canEditContent(session.role)) {
    return { error: "Tài khoản của bạn không có quyền sửa cán bộ." };
  }

  const staffId = String(formData.get("staffId") ?? "").trim();
  if (!staffId || !UUID_RE.test(staffId)) {
    return { error: "Mã cán bộ không hợp lệ." };
  }

  const existing = await findStaffMemberById(staffId);
  if (!existing) {
    return { error: "Không tìm thấy cán bộ." };
  }

  const parsed = parseStaffFormData(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }

  const file = formData.get("avatar");
  let avatarRelativePath = existing.avatarRelativePath;
  let newAvatarRelativePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    const saved = await saveAvatarIfAny(session, file);
    if (!saved.ok) {
      return { error: saved.error };
    }
    newAvatarRelativePath = saved.relativePath;
    if (existing.avatarRelativePath) {
      try {
        await removeSupabaseObject(existing.avatarRelativePath);
      } catch {
        /* ignore */
      }
    }
    avatarRelativePath = saved.relativePath;
  }

  try {
    await updateStaffMemberById(staffId, {
      ...parsed.data,
      avatarRelativePath,
    });
  } catch (e) {
    console.error(e);
    if (newAvatarRelativePath) {
      try {
        await removeSupabaseObject(newAvatarRelativePath);
      } catch {
        /* ignore */
      }
    }
    return { error: "Không thể cập nhật cán bộ. Thử lại sau." };
  }

  revalidatePath("/can-bo");
  revalidatePath(`/can-bo/${staffId}/chinh-sua`);
  return { ok: true };
}
