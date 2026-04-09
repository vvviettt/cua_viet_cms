"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";
import { setCitizenAccountActiveById } from "@/lib/db/citizen-accounts";

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
  if (!canManageUsers(session.role)) {
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

