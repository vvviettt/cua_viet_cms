import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { canManageUsers } from "@/lib/roles";
import { listCitizenAccounts } from "@/lib/db/citizen-accounts";
import { ToggleCitizenActiveForm } from "@/components/citizen-accounts/toggle-citizen-active-form";

export const metadata: Metadata = {
  title: "Tài khoản ứng dụng",
  description: "Quản lý tài khoản người dân trên ứng dụng — " + SITE.shortTitle,
};

export default async function NguoiDungPage() {
  const session = await getSession();
  const canToggle = session != null && canManageUsers(session.isAdmin);
  const items = await listCitizenAccounts();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
      >
        ← Bảng điều khiển
      </Link>

      <header className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Tài khoản ứng dụng
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Danh sách tài khoản người dân đăng nhập app. Bật/tắt: quản trị viên.
        </p>
      </header>

      <section className="mt-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-700">
            <tr>
              <th className="px-4 py-3 font-semibold">SĐT</th>
              <th className="px-4 py-3 font-semibold">Họ tên</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={5}>
                  Chưa có tài khoản nào.
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3 font-medium text-zinc-900">{u.phone}</td>
                  <td className="px-4 py-3 text-zinc-700">{u.fullName}</td>
                  <td className="px-4 py-3 text-zinc-700">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canToggle ? (
                      <ToggleCitizenActiveForm citizenAccountId={u.id} isActive={u.isActive} />
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

