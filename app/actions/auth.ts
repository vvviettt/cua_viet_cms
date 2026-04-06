"use server";

import { compareSync } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";
import { getUserByEmailForAuth } from "@/lib/db/users";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AuthState = { error?: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const emailRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!emailRaw || !password) {
    return { error: "Vui lòng nhập đầy đủ email và mật khẩu." };
  }

  const email = normalizeEmail(emailRaw);
  const user = await getUserByEmailForAuth(email);

  if (!user || !user.isActive || !compareSync(password, user.passwordHash)) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  const jar = await cookies();
  jar.set(
    SESSION_COOKIE,
    JSON.stringify({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.fullName ?? undefined,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    },
  );

  redirect("/");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/dang-nhap");
}
