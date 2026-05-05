"use server";

import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { CMS_MODULES, type CmsModuleKey } from "@/lib/cms-modules";
import { canManageUsers } from "@/lib/roles";
import {
  countAdminUsers,
  deleteUserById,
  emailTakenByOtherUser,
  getUserByEmailForAuth,
  getUserById,
  insertCmsUser,
  setUserActiveById,
  setUserIsAdminFlag,
  updateCmsUserPasswordHash,
  updateCmsUserProfile,
} from "@/lib/db/users";
import { replaceAllPermissionsForUser } from "@/lib/db/user-module-permissions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function revalidatePhanQuyenPages(userId?: string) {
  revalidatePath("/phan-quyen");
  revalidatePath("/phan-quyen/them");
  if (userId && UUID_RE.test(userId)) {
    revalidatePath(`/phan-quyen/${userId}`);
  }
}

export type CreateCmsUserState = {
  ok?: boolean;
  error?: string;
  userId?: string;
  /** true khi tạo quản trị viên; bỏ qua bước gán module. */
  createdAsAdmin?: boolean;
};

export async function createCmsUser(
  _prev: CreateCmsUserState,
  formData: FormData,
): Promise<CreateCmsUserState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canManageUsers(session.isAdmin)) {
    return { error: "Không có quyền tạo tài khoản." };
  }

  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullNameRaw = String(formData.get("fullName") ?? "").trim();
  const cmsRole = String(formData.get("cmsRole") ?? "cms").trim();
  const isAdmin = cmsRole === "admin";

  if (!emailRaw || !EMAIL_RE.test(emailRaw)) {
    return { error: "Email không hợp lệ." };
  }
  if (password.length < 8) {
    return { error: "Mật khẩu tối thiểu 8 ký tự." };
  }

  const existing = await getUserByEmailForAuth(emailRaw);
  if (existing) {
    return { error: "Email đã được dùng." };
  }

  const passwordHash = hashSync(password, 12);
  try {
    const userId = await insertCmsUser({
      email: emailRaw,
      passwordHash,
      fullName: fullNameRaw.length > 0 ? fullNameRaw : null,
      isAdmin,
    });
    revalidatePhanQuyenPages(userId);
    return { ok: true, userId, createdAsAdmin: isAdmin };
  } catch {
    return { error: "Không tạo được tài khoản. Thử lại sau." };
  }
}

function emptyModuleEntries() {
  return CMS_MODULES.map((m) => ({
    moduleKey: m.key,
    canRead: false,
    canEdit: false,
  }));
}

export type SetCmsUserRoleState = { ok?: boolean; error?: string };

export async function setCmsUserRole(
  _prev: SetCmsUserRoleState,
  formData: FormData,
): Promise<SetCmsUserRoleState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canManageUsers(session.isAdmin)) {
    return { error: "Không có quyền thay đổi vai trò." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId || !UUID_RE.test(userId)) {
    return { error: "Người dùng không hợp lệ." };
  }

  const nextAdmin = String(formData.get("cmsRole") ?? "").trim() === "admin";
  const row = await getUserById(userId);
  if (!row) {
    return { error: "Không tìm thấy người dùng." };
  }

  if (row.isAdmin && !nextAdmin) {
    const admins = await countAdminUsers();
    if (admins <= 1) {
      return { error: "Không thể bỏ quyền quản trị của tài khoản quản trị duy nhất." };
    }
  }

  try {
    await setUserIsAdminFlag(userId, nextAdmin);
    if (nextAdmin) {
      await replaceAllPermissionsForUser(userId, emptyModuleEntries());
    }
  } catch {
    return { error: "Không cập nhật được vai trò. Thử lại sau." };
  }

  revalidatePhanQuyenPages(userId);
  return { ok: true };
}

function parseModulePermissionEntries(
  formData: FormData,
): { ok: true; entries: Array<{ moduleKey: CmsModuleKey; canRead: boolean; canEdit: boolean }> } | { ok: false; error: string } {
  const entries: Array<{ moduleKey: CmsModuleKey; canRead: boolean; canEdit: boolean }> = [];
  for (const mod of CMS_MODULES) {
    const raw = String(formData.get(`perm_${mod.key}`) ?? "").trim();
    if (raw === "read") {
      entries.push({ moduleKey: mod.key, canRead: true, canEdit: false });
    } else if (raw === "edit") {
      entries.push({ moduleKey: mod.key, canRead: false, canEdit: true });
    } else if (raw === "none" || raw === "") {
      entries.push({ moduleKey: mod.key, canRead: false, canEdit: false });
    } else {
      return { ok: false, error: "Giá trị quyền module không hợp lệ." };
    }
  }
  return { ok: true, entries };
}

export type SaveCmsUserPhanQuyenState = { ok?: boolean; error?: string };

/** Một lần lưu: vai trò (admin / CMS) và toàn bộ quyền module khi là CMS. */
export async function saveCmsUserPhanQuyen(
  _prev: SaveCmsUserPhanQuyenState,
  formData: FormData,
): Promise<SaveCmsUserPhanQuyenState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canManageUsers(session.isAdmin)) {
    return { error: "Không có quyền phân quyền." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId || !UUID_RE.test(userId)) {
    return { error: "Người dùng không hợp lệ." };
  }

  const cmsRoleRaw = String(formData.get("cmsRole") ?? "").trim();
  if (cmsRoleRaw !== "admin" && cmsRoleRaw !== "cms") {
    return { error: "Chọn vai trò hợp lệ." };
  }
  const nextAdmin = cmsRoleRaw === "admin";

  const row = await getUserById(userId);
  if (!row) {
    return { error: "Không tìm thấy người dùng." };
  }

  if (row.isAdmin && !nextAdmin) {
    const admins = await countAdminUsers();
    if (admins <= 1) {
      return { error: "Không thể bỏ quyền quản trị của tài khoản quản trị duy nhất." };
    }
  }

  try {
    await setUserIsAdminFlag(userId, nextAdmin);
    if (nextAdmin) {
      await replaceAllPermissionsForUser(userId, emptyModuleEntries());
    } else {
      const parsed = parseModulePermissionEntries(formData);
      if (!parsed.ok) {
        return { error: parsed.error };
      }
      await replaceAllPermissionsForUser(userId, parsed.entries);
    }
  } catch {
    return { error: "Không lưu được. Thử lại sau." };
  }

  revalidatePhanQuyenPages(userId);
  return { ok: true };
}

export type UpdateCmsUserProfileState = { ok?: boolean; error?: string };

export async function updateCmsUserProfileAction(
  _prev: UpdateCmsUserProfileState,
  formData: FormData,
): Promise<UpdateCmsUserProfileState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canManageUsers(session.isAdmin)) {
    return { error: "Không có quyền chỉnh sửa." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId || !UUID_RE.test(userId)) {
    return { error: "Người dùng không hợp lệ." };
  }

  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullNameRaw = String(formData.get("fullName") ?? "").trim();
  const passwordNew = String(formData.get("passwordNew") ?? "");

  if (!emailRaw || !EMAIL_RE.test(emailRaw)) {
    return { error: "Email không hợp lệ." };
  }

  if (await emailTakenByOtherUser(emailRaw, userId)) {
    return { error: "Email đã được dùng bởi tài khoản khác." };
  }

  if (passwordNew.length > 0 && passwordNew.length < 8) {
    return { error: "Mật khẩu mới tối thiểu 8 ký tự (hoặc để trống để giữ mật khẩu cũ)." };
  }

  try {
    await updateCmsUserProfile({
      userId,
      email: emailRaw,
      fullName: fullNameRaw.length > 0 ? fullNameRaw : null,
    });
    if (passwordNew.length >= 8) {
      await updateCmsUserPasswordHash(userId, hashSync(passwordNew, 12));
    }
  } catch {
    return { error: "Không lưu được. Thử lại sau." };
  }

  revalidatePhanQuyenPages(userId);
  return { ok: true };
}

export type ToggleCmsUserActiveState = { ok?: boolean; error?: string };

async function runToggleCmsUserActive(
  formData: FormData,
): Promise<ToggleCmsUserActiveState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canManageUsers(session.isAdmin)) {
    return { error: "Không có quyền." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  const nextActive = String(formData.get("nextActive") ?? "") === "1";
  if (!userId || !UUID_RE.test(userId)) {
    return { error: "Người dùng không hợp lệ." };
  }

  if (userId === session.userId && !nextActive) {
    return { error: "Không thể tự vô hiệu hóa tài khoản của chính mình." };
  }

  const row = await getUserById(userId);
  if (!row) {
    return { error: "Không tìm thấy người dùng." };
  }
  if (row.isAdmin && !nextActive) {
    const admins = await countAdminUsers();
    if (admins <= 1) {
      return { error: "Không thể vô hiệu hóa quản trị viên duy nhất." };
    }
  }

  try {
    await setUserActiveById(userId, nextActive);
  } catch {
    return { error: "Không cập nhật được trạng thái." };
  }

  revalidatePhanQuyenPages(userId);
  return { ok: true };
}

/** Dùng với `useActionState` trong client. */
export async function toggleCmsUserActive(
  _prev: ToggleCmsUserActiveState,
  formData: FormData,
): Promise<ToggleCmsUserActiveState> {
  return runToggleCmsUserActive(formData);
}

/** Dùng với `<form action={...}>` (một tham số FormData). */
export async function toggleCmsUserActiveForm(formData: FormData): Promise<void> {
  await runToggleCmsUserActive(formData);
}

export type DeleteCmsUserState = { ok?: boolean; error?: string };

export async function deleteCmsUser(
  _prev: DeleteCmsUserState,
  formData: FormData,
): Promise<DeleteCmsUserState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canManageUsers(session.isAdmin)) {
    return { error: "Không có quyền xóa." };
  }

  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId || !UUID_RE.test(userId)) {
    return { error: "Người dùng không hợp lệ." };
  }

  if (userId === session.userId) {
    return { error: "Không thể xóa tài khoản của chính mình." };
  }

  const row = await getUserById(userId);
  if (!row) {
    return { error: "Không tìm thấy người dùng." };
  }

  if (row.isAdmin) {
    const admins = await countAdminUsers();
    if (admins <= 1) {
      return { error: "Không thể xóa quản trị viên duy nhất." };
    }
  }

  try {
    await deleteUserById(userId);
  } catch {
    return { error: "Không xóa được. Thử lại sau." };
  }

  revalidatePhanQuyenPages(userId);
  return { ok: true };
}
