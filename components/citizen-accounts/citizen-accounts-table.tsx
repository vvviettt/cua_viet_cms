"use client";

import { Eye, KeyRound } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import {
  adminResetCitizenPassword,
  toggleCitizenAccountActive,
  type ResetCitizenPasswordState,
  type ToggleCitizenAccountState,
} from "@/app/actions/citizen-accounts";
import type { CitizenAccountListItem } from "@/lib/db/citizen-accounts";
import { Modal } from "@/components/ui/modal";
import { CitizenAccountsPagination } from "@/components/citizen-accounts/citizen-accounts-pagination";

function formatCitizenDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-900">{value || "—"}</dd>
    </div>
  );
}

function CitizenAccountToggleButton({
  citizenAccountId,
  isActive,
}: {
  citizenAccountId: string;
  isActive: boolean;
}) {
  const [state, action, pending] = useActionState<ToggleCitizenAccountState, FormData>(
    toggleCitizenAccountActive,
    {},
  );
  const nextActive = !isActive;

  return (
    <form action={action} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="citizenAccountId" value={citizenAccountId} />
      <input type="hidden" name="nextActive" value={String(nextActive)} />
      <button
        type="submit"
        disabled={pending}
        title={isActive ? "Nhấn để vô hiệu hóa" : "Nhấn để kích hoạt"}
        className={
          "inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 " +
          (isActive
            ? "bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100"
            : "bg-zinc-100 text-zinc-800 ring-zinc-200 hover:bg-zinc-200")
        }
      >
        {pending ? "Đang lưu..." : isActive ? "Active" : "Inactive"}
      </button>
      {state?.error ? (
        <span className="max-w-[140px] text-xs font-medium text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}

function ResetPasswordModal({
  account,
  open,
  onClose,
}: {
  account: CitizenAccountListItem;
  open: boolean;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ResetCitizenPasswordState, FormData>(
    adminResetCitizenPassword,
    {},
  );

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state?.ok, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cập nhật mật khẩu"
      maxWidthClassName="max-w-md"
      bodyClassName="px-5 py-5"
    >
      <p className="text-sm text-zinc-600">
        Đặt mật khẩu mới cho <span className="font-semibold text-zinc-900">{account.fullName}</span>{" "}
        ({account.phone}).
      </p>
      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="citizenAccountId" value={account.id} />
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Mật khẩu mới</span>
          <input
            type="password"
            name="password"
            required
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-(--portal-primary) focus:border-(--portal-primary) focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Xác nhận mật khẩu</span>
          <input
            type="password"
            name="passwordConfirm"
            required
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-(--portal-primary) focus:border-(--portal-primary) focus:ring-2"
          />
        </label>
        {state?.error ? (
          <p className="text-sm font-medium text-red-600">{state.error}</p>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-(--portal-primary) px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Đang lưu..." : "Lưu mật khẩu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CitizenAccountDetailModal({
  account,
  open,
  onClose,
}: {
  account: CitizenAccountListItem;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi tiết tài khoản"
      maxWidthClassName="max-w-lg"
      bodyClassName="px-5 py-5"
    >
      <dl className="space-y-4">
        <DetailRow label="Họ tên" value={account.fullName} />
        <DetailRow label="Số điện thoại" value={account.phone} />
        <DetailRow label="CCCD" value={account.cccd ?? "—"} />
        <DetailRow label="Email" value={account.email ?? "—"} />
        <DetailRow label="Địa chỉ" value={account.address} />
        <DetailRow label="Ngày đăng ký" value={formatCitizenDate(account.createdAt)} />
        <DetailRow label="Cập nhật lúc" value={formatCitizenDate(account.updatedAt)} />
        <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
          <dt className="text-sm font-medium text-zinc-500">Trạng thái</dt>
          <dd>
            {account.isActive ? (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                Inactive
              </span>
            )}
          </dd>
        </div>
      </dl>
    </Modal>
  );
}

export function CitizenAccountsTable({
  items,
  canManage,
  pagination,
}: {
  items: CitizenAccountListItem[];
  canManage: boolean;
  pagination: {
    basePath: string;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
  };
}) {
  const [detailAccount, setDetailAccount] = useState<CitizenAccountListItem | null>(null);
  const [passwordAccount, setPasswordAccount] = useState<CitizenAccountListItem | null>(null);

  return (
    <>
      <section className="mt-8 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-700">
            <tr>
              <th className="px-4 py-3 font-semibold">Họ tên</th>
              <th className="px-4 py-3 font-semibold">SĐT</th>
              <th className="px-4 py-3 font-semibold">CCCD</th>
              <th className="px-4 py-3 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={4}>
                  Chưa có tài khoản nào.
                </td>
              </tr>
            ) : (
              items.map((u) => (
                <tr key={u.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3 font-medium text-zinc-900">{u.fullName}</td>
                  <td className="px-4 py-3 text-zinc-700">{u.phone}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-700">{u.cccd ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailAccount(u)}
                        title="Xem chi tiết"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                      >
                        <Eye className="h-4 w-4" aria-hidden />
                        <span className="sr-only">Xem chi tiết</span>
                      </button>
                      {canManage ? (
                        <>
                          <CitizenAccountToggleButton
                            citizenAccountId={u.id}
                            isActive={u.isActive}
                          />
                          <button
                            type="button"
                            onClick={() => setPasswordAccount(u)}
                            title="Cập nhật mật khẩu"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-50"
                          >
                            <KeyRound className="h-3.5 w-3.5" aria-hidden />
                            Mật khẩu
                          </button>
                        </>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <CitizenAccountsPagination {...pagination} />
      </section>

      {detailAccount ? (
        <CitizenAccountDetailModal
          account={detailAccount}
          open
          onClose={() => setDetailAccount(null)}
        />
      ) : null}

      {passwordAccount ? (
        <ResetPasswordModal
          account={passwordAccount}
          open
          onClose={() => setPasswordAccount(null)}
        />
      ) : null}
    </>
  );
}
