"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  moveAppMobileShellTabServer,
  setAppMobileShellTabActiveServer,
} from "@/app/actions/app-mobile-config";
import type { AppMobileShellTabKey } from "@/lib/app-mobile-cau-hinh-paths";

import type { AppMobileListShellTab } from "./app-mobile-config-types";
import { AppMobileOrderArrows } from "./app-mobile-order-arrows";

export function AppMobileShellTabVisibleToggle({
  canEdit,
  tabId,
  defaultChecked,
}: {
  canEdit: boolean;
  tabId: string;
  defaultChecked: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          disabled={!canEdit || pending}
          onChange={(e) => {
            const checked = e.target.checked;
            startTransition(async () => {
              setError(null);
              const res = await setAppMobileShellTabActiveServer(tabId, checked);
              if (res.error) {
                setError(res.error);
                return;
              }
              router.refresh();
            });
          }}
          className="size-4 rounded border-zinc-300 text-(--portal-primary)"
        />
        <span className="text-sm font-medium text-zinc-900">Hiển thị trên app</span>
      </label>
      {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
    </div>
  );
}

type Props = {
  canEdit: boolean;
  tabs: AppMobileListShellTab[];
  /** Chỉ hiển thị một tab (trang cấu hình theo từng mục app). */
  onlyTabKey?: AppMobileShellTabKey;
  /** Tiêu đề khối (mặc định khi xem tất cả tab). */
  title?: string;
  /** Mô tả khối. */
  description?: string;
  /** Bỏ khung + tiêu đề khi đã có trong layout cha. */
  embedded?: boolean;
};

const TAB_HINT: Record<string, string> = {
  home: "Trang chủ và các mục con (tin, phản ánh, …).",
  assistant: "Trợ lý ảo.",
  notifications: "Danh sách thông báo.",
  profile: "Cài đặt / tài khoản.",
};

export function AppMobileShellTabsPanel({
  canEdit,
  tabs,
  onlyTabKey,
  title: titleProp,
  description: descriptionProp,
  embedded = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      setError(null);
      await fn();
      router.refresh();
    });
  };

  const onToggle = (id: string, checked: boolean) => {
    startTransition(async () => {
      setError(null);
      const res = await setAppMobileShellTabActiveServer(id, checked);
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  const title =
    titleProp ??
    (onlyTabKey ? "Tab trên thanh điều hướng app" : "Thanh điều hướng dưới app");
  const description =
    descriptionProp ??
    (onlyTabKey
      ? "Bật hoặc tắt tab này trên app, và đổi thứ tự so với các tab khác (mũi tên). Phải giữ ít nhất một tab đang bật."
      : "Bật/tắt và sắp xếp các tab (Trang chủ, Trợ lý ảo, Thông báo, Cài đặt). Phải giữ ít nhất một tab đang bật. Nhãn hiển thị trên app lấy từ cột nhãn bên dưới (đồng bộ với API công khai).");

  const rows = onlyTabKey ? tabs.filter((t) => t.tabKey === onlyTabKey) : tabs;

  return (
    <section
      className={
        embedded
          ? "rounded-xl border-0 bg-transparent p-0 shadow-none"
          : "rounded-xl border border-(--portal-border) bg-white p-5 shadow-sm sm:p-6"
      }
    >
      {!embedded ? (
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <p className="mt-2 text-sm text-zinc-600">{description}</p>
        </div>
      ) : null}

      {error ? (
        <p className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 ${embedded ? "mt-0" : "mt-4"}`} role="alert">
          {error}
        </p>
      ) : null}

      {onlyTabKey && rows.length === 0 ? (
        <p className={`text-sm text-zinc-600 ${embedded ? "mt-2" : "mt-6"}`}>Không tìm thấy tab tương ứng trong cơ sở dữ liệu.</p>
      ) : null}

      <ul className={`flex list-none flex-col gap-3 p-0 ${embedded ? "mt-2" : "mt-6"}`}>
        {rows.map((row) => {
          const idx = tabs.findIndex((t) => t.id === row.id);
          return (
          <li
            key={row.id}
            className="flex flex-wrap items-start gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-3 sm:px-4"
          >
            {canEdit ? (
              <AppMobileOrderArrows
                disabled={pending}
                canUp={idx > 0}
                canDown={idx >= 0 && idx < tabs.length - 1}
                onUp={() => run(() => moveAppMobileShellTabServer(row.id, "up"))}
                onDown={() => run(() => moveAppMobileShellTabServer(row.id, "down"))}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-semibold text-zinc-900">{row.label}</span>
                <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-xs text-zinc-700">{row.tabKey}</code>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{TAB_HINT[row.tabKey] ?? "Tab điều hướng ứng dụng."}</p>
              {!onlyTabKey ? (
                <label className="mt-2 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.isActive}
                    disabled={!canEdit || pending}
                    onChange={(e) => onToggle(row.id, e.target.checked)}
                    className="size-4 rounded border-zinc-300 text-(--portal-primary)"
                  />
                  <span className="text-sm text-zinc-800">Hiển thị trên app</span>
                </label>
              ) : null}
            </div>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
