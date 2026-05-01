"use server";

import { hashSync } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { getUserByEmailForAuth, insertCmsUser } from "@/lib/db/users";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CreateCmsUserState = { ok?: boolean; error?: string; userId?: string };

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
    });
    revalidatePath("/phan-quyen");
    revalidatePath("/phan-quyen/them");
    return { ok: true, userId };
  } catch {
    return { error: "Không tạo được tài khoản. Thử lại sau." };
  }
}
