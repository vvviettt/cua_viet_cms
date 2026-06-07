"use server";

import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import {
  setCitizenAccountActiveById,
  updateCitizenPasswordById,
} from "@/lib/db/citizen-accounts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ToggleCitizenAccountState = { ok?: boolean; error?: string };

export async function toggleCitizenAccountActive(
  _prev: ToggleCitizenAccountState,
  formData: FormData,
): Promise<ToggleCitizenAccountState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canManageUsers(session.isAdmin)) {
    return { error: "Tài khoản của bạn không có quyền quản lý tài khoản ứng dụng." };
  }

  const id = String(formData.get("citizenAccountId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) {
    return { error: "Mã tài khoản không hợp lệ." };
  }

  const nextActive = String(formData.get("nextActive") ?? "").trim();
  if (nextActive !== "true" && nextActive !== "false") {
    return { error: "Trạng thái kích hoạt không hợp lệ." };
  }

  try {
    await setCitizenAccountActiveById(id, nextActive === "true");
  } catch (e) {
    console.error(e);
    return { error: "Không thể cập nhật trạng thái tài khoản. Thử lại sau." };
  }

  revalidatePath("/nguoi-dung");
  return { ok: true };
}

export type ResetCitizenPasswordState = { ok?: boolean; error?: string };

export async function adminResetCitizenPassword(
  _prev: ResetCitizenPasswordState,
  formData: FormData,
): Promise<ResetCitizenPasswordState> {
  const session = await getSession();
  if (!session) {
    return { error: "Phiên đăng nhập không hợp lệ." };
  }
  if (!canManageUsers(session.isAdmin)) {
    return { error: "Tài khoản của bạn không có quyền quản lý tài khoản ứng dụng." };
  }

  const id = String(formData.get("citizenAccountId") ?? "").trim();
  if (!id || !UUID_RE.test(id)) {
    return { error: "Mã tài khoản không hợp lệ." };
  }

  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  if (password.length < 6 || password.length > 128) {
    return { error: "Mật khẩu cần từ 6 đến 128 ký tự." };
  }
  if (password !== passwordConfirm) {
    return { error: "Xác nhận mật khẩu không khớp." };
  }

  try {
    await updateCitizenPasswordById(id, hashSync(password, 10));
  } catch (e) {
    console.error(e);
    return { error: "Không thể cập nhật mật khẩu. Thử lại sau." };
  }

  revalidatePath("/nguoi-dung");
  return { ok: true };
}

