import type { AdminUserListItem } from "@/lib/db/users";
import { DeleteUserButton } from "@/components/phan-quyen/delete-user-button";
import { ToggleUserActiveButton } from "@/components/phan-quyen/toggle-user-active-button";
import { cn } from "@/lib/utils";

type Props = {
  users: AdminUserListItem[];
  currentUserId: string;
  onOpenChiTiet: (user: AdminUserListItem) => void;
  onOpenPhanQuyen: (user: AdminUserListItem) => void;
};

export function CmsUsersTable(props: Props) {
  const { users, currentUserId, onOpenChiTiet, onOpenPhanQuyen } = props;

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-600">
        Không có tài khoản khác trong hệ thống (ngoài tài khoản của bạn).
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-700">
          <tr>
            <th className="px-3 py-3 font-semibold">Người dùng</th>
            <th className="px-3 py-3 font-semibold">Email</th>
            <th className="px-3 py-3 font-semibold">Vai trò</th>
            <th className="px-3 py-3 font-semibold">Trạng thái</th>
            <th className="min-w-[280px] px-3 py-3 text-right font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-zinc-100 last:border-0">
              <td className="px-3 py-3 align-middle">
                <span className={cn("font-medium text-zinc-900", !u.isActive && "opacity-70")}>
                  {u.fullName?.trim() || "—"}
                </span>
              </td>
              <td className="max-w-[200px] truncate px-3 py-3 align-middle text-zinc-700">{u.email}</td>
              <td className="px-3 py-3 align-middle">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1",
                    u.isAdmin
                      ? "bg-amber-50 text-amber-900 ring-amber-200"
                      : "bg-zinc-100 text-zinc-800 ring-zinc-200",
                  )}
                >
                  {u.isAdmin ? "Quản trị" : "CMS"}
                </span>
              </td>
              <td className="px-3 py-3 align-middle">
                {u.isActive ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    Hoạt động
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                    Vô hiệu
                  </span>
                )}
              </td>
              <td className="px-3 py-3 align-middle">
                <div className="flex flex-wrap items-start justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenChiTiet(u)}
                    className="inline-flex min-w-[5rem] shrink-0 cursor-pointer items-center justify-center rounded-lg bg-(--portal-primary) px-2.5 py-1.5 text-xs font-semibold text-white transition-transform active:scale-[0.98]"
                  >
                    Chi tiết
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPhanQuyen(u)}
                    className="inline-flex min-w-[5rem] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 active:scale-[0.98]"
                  >
                    Phân quyền
                  </button>
                  <ToggleUserActiveButton userId={u.id} isActive={u.isActive} labelMode="short" />
                  <DeleteUserButton userId={u.id} email={u.email} disabled={u.id === currentUserId} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
