import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: "Đăng nhập hệ thống quản trị nội dung Xã Cửa Việt.",
};

export default async function DangNhapPage() {
  const session = await getSession();
  if (session) {
    redirect("/");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="sr-only">Đăng nhập quản trị</h1>
        <LoginForm />
      </div>
    </div>
  );
}
