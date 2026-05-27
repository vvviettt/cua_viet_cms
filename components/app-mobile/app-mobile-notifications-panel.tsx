"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Pencil, Plus, Send, Trash2 } from "lucide-react";

import type { AppMobileFormState } from "@/app/actions/app-mobile-config";
import {
  createAppMobileNotificationAction,
  deleteAppMobileNotificationServer,
  sendAppMobileNotificationAction,
  updateAppMobileNotificationAction,
} from "@/app/actions/app-mobile-notifications";
import {
  APP_MOBILE_NOTIFICATION_CATEGORIES,
  APP_MOBILE_NOTIFICATION_CATEGORY_LABELS,
  type AppMobileNotificationCategory,
} from "@/lib/app-mobile-notifications/constants";
import { AppMobileNotificationsPagination } from "@/components/app-mobile/app-mobile-notifications-pagination";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

export type NotificationListItem = {
  id: string;
  category: AppMobileNotificationCategory;
  title: string;
  content: string;
  sentAt: string | null;
  createdAt: string;
};

type PaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

type Props = {
  canEdit: boolean;
  items: NotificationListItem[];
  pagination: PaginationProps;
};

const initialFormState: AppMobileFormState = {};

function clampText(s: string, n: number) {
  const t = (s ?? "").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n).trimEnd()}…`;
}

function formatDateTime(iso: string) {
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: vi });
  } catch {
    return iso;
  }
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium leading-none text-foreground">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AppMobileNotificationsPanel({ canEdit, items, pagination }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<NotificationListItem | null>(null);
  const [pending, startTransition] = useTransition();

  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const closeEdit = useCallback(() => setEditItem(null), []);

  const onDelete = (id: string) => {
    if (!window.confirm("Xóa thông báo này?")) return;
    startTransition(async () => {
      await deleteAppMobileNotificationServer(id);
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Danh sách thông báo</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Loại, tiêu đề và nội dung. Mặc định gửi ngay khi thêm; có thể chọn gửi sau.
          </p>
        </div>
        {canEdit ? (
          <Button variant="outline" size="sm" type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            Thêm thông báo
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
            Chưa có thông báo.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="hidden gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600 sm:grid sm:grid-cols-[1fr_120px_140px_auto]">
              <div>Nội dung</div>
              <div>Loại</div>
              <div>Trạng thái gửi</div>
              <div className="text-right">Thao tác</div>
            </div>
            <ul className="divide-y divide-zinc-200">
              {items.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <div className="flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_120px_140px_auto] sm:items-start sm:gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900">{n.title}</p>
                      <p className="mt-1 text-sm text-zinc-600">{clampText(n.content, 120)}</p>
                      <p className="mt-1 text-xs text-zinc-400">Tạo: {formatDateTime(n.createdAt)}</p>
                    </div>
                    <div className="text-sm text-zinc-700 sm:pt-0.5">
                      {APP_MOBILE_NOTIFICATION_CATEGORY_LABELS[n.category]}
                    </div>
                    <div className="sm:pt-0.5">
                      {n.sentAt ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Đã gửi · {formatDateTime(n.sentAt)}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
                          Chưa gửi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      {canEdit ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setEditItem(n)}
                            title="Sửa"
                            aria-label="Sửa"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            onClick={() => onDelete(n.id)}
                            disabled={pending}
                            title="Xóa"
                            aria-label="Xóa"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <AppMobileNotificationsPagination {...pagination} />

      {createOpen ? (
        <NotificationCreateModal open onClose={closeCreate} canEdit={canEdit} />
      ) : null}
      {editItem ? (
        <NotificationEditModal open onClose={closeEdit} canEdit={canEdit} initial={editItem} />
      ) : null}
    </section>
  );
}

function NotificationCreateModal({
  open,
  onClose,
  canEdit,
}: {
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createAppMobileNotificationAction, initialFormState);
  const handledOkRef = useRef(false);

  useEffect(() => {
    if (!state?.ok || handledOkRef.current) return;
    handledOkRef.current = true;
    onClose();
    router.refresh();
  }, [state?.ok, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} title="Thêm thông báo" maxWidthClassName="max-w-xl">
      {state?.error ? (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state.error}
        </p>
      ) : null}
      <form action={action} className="space-y-4">
        <SelectField
          label="Loại"
          name="category"
          defaultValue="system"
          disabled={!canEdit || pending}
          options={APP_MOBILE_NOTIFICATION_CATEGORIES.map((v) => ({
            value: v,
            label: APP_MOBILE_NOTIFICATION_CATEGORY_LABELS[v],
          }))}
        />
        <InputField label="Tiêu đề" name="title" disabled={!canEdit || pending} required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium leading-none text-foreground">Nội dung</label>
          <textarea
            name="content"
            required
            disabled={!canEdit || pending}
            className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50"
          />
        </div>
        <label className="flex cursor-pointer items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="deferSend"
            value="true"
            disabled={!canEdit || pending}
            className="mt-0.5 size-4 rounded border-zinc-300"
          />
          <span>
            <span className="font-medium">Gửi sau</span>
            <span className="mt-0.5 block text-xs text-zinc-500">
              Bật để chưa gửi tới người dùng; gửi thủ công khi chỉnh sửa. Mặc định (không bật) sẽ gửi ngay sau khi lưu.
            </span>
          </span>
        </label>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={!canEdit || pending}
            className="bg-(--portal-primary) text-white hover:bg-(--portal-primary-hover)"
          >
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function NotificationEditModal({
  open,
  onClose,
  canEdit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  initial: NotificationListItem | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateAppMobileNotificationAction, initialFormState);
  const [sendState, sendAction, sendPending] = useActionState(sendAppMobileNotificationAction, initialFormState);
  const handledUpdateOkRef = useRef(false);
  const handledSendOkRef = useRef(false);

  useEffect(() => {
    if (!state?.ok || handledUpdateOkRef.current) return;
    handledUpdateOkRef.current = true;
    onClose();
    router.refresh();
  }, [state?.ok, onClose, router]);

  useEffect(() => {
    if (!sendState?.ok || handledSendOkRef.current) return;
    handledSendOkRef.current = true;
    router.refresh();
  }, [sendState?.ok, router]);

  if (!initial) return null;

  const isSent = !!initial.sentAt;
  const busy = pending || sendPending;

  return (
    <Modal open={open} onClose={onClose} title="Sửa thông báo" maxWidthClassName="max-w-xl">
      {(state?.error || sendState?.error) ? (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state?.error ?? sendState?.error}
        </p>
      ) : null}
      {sendState?.ok ? (
        <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Đã gửi thông báo tới người dùng (mock).
        </p>
      ) : null}

      {!isSent ? (
        <form action={sendAction} className="mb-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <input type="hidden" name="id" value={initial.id} />
          <p className="text-sm text-zinc-700">Thông báo này chưa gửi tới người dùng.</p>
          {canEdit ? (
            <Button
              type="submit"
              disabled={busy}
              className="mt-3 bg-(--portal-primary) text-white hover:bg-(--portal-primary-hover)"
            >
              <Send className="mr-1.5 size-4" />
              {sendPending ? "Đang gửi…" : "Gửi đến người dùng"}
            </Button>
          ) : null}
        </form>
      ) : (
        <p className="mb-4 text-sm text-emerald-800">
          Đã gửi lúc {formatDateTime(initial.sentAt!)} — không thể gửi lại từ đây.
        </p>
      )}

      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={initial.id} />
        <SelectField
          label="Loại"
          name="category"
          defaultValue={initial.category}
          disabled={!canEdit || busy}
          options={APP_MOBILE_NOTIFICATION_CATEGORIES.map((v) => ({
            value: v,
            label: APP_MOBILE_NOTIFICATION_CATEGORY_LABELS[v],
          }))}
        />
        <InputField
          label="Tiêu đề"
          name="title"
          defaultValue={initial.title}
          disabled={!canEdit || busy}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium leading-none text-foreground">Nội dung</label>
          <textarea
            name="content"
            required
            defaultValue={initial.content}
            disabled={!canEdit || busy}
            className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button
            type="submit"
            disabled={!canEdit || busy}
            className="bg-(--portal-primary) text-white hover:bg-(--portal-primary-hover)"
          >
            {pending ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
