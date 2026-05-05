"use server";

import { revalidatePath } from "next/cache";
import { CMS_MODULES, type CmsModuleKey } from "@/lib/cms-modules";
import { getSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { getUserIsAdminById } from "@/lib/db/users";
import { replaceAllPermissionsForUser } from "@/lib/db/user-module-permissions";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SaveUserModulePermissionsState = { ok?: boolean; error?: string };

export async function saveUserModulePermissions(
  _prev: SaveUserModulePermissionsState,
  formData: FormData,
): Promise<SaveUserModulePermissionsState> {
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

  const targetIsAdmin = await getUserIsAdminById(userId);
  if (targetIsAdmin === true) {
    return { error: "Quản trị viên không gán quyền module." };
  }
  if (targetIsAdmin === null) {
    return { error: "Không tìm thấy người dùng." };
  }

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
      return { error: "Giá trị quyền module không hợp lệ." };
    }
  }

  try {
    await replaceAllPermissionsForUser(userId, entries);
  } catch {
    return { error: "Không lưu được. Thử lại sau." };
  }

  revalidatePath("/phan-quyen");
  revalidatePath(`/phan-quyen/${userId}`);
  return { ok: true };
}
