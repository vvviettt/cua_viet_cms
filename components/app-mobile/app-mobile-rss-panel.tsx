"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";

import {
  createAppMobileRssFeedAction,
  deleteAppMobileRssFeedFormAction,
  moveAppMobileRssFeedServer,
  setAppMobileRssFeedActiveServer,
  type AppMobileFormState,
} from "@/app/actions/app-mobile-config";
import { Modal } from "@/components/ui/modal";

import type { AppMobileListRssFeed } from "./app-mobile-config-types";

type Props = {
  canEdit: boolean;
  feeds: AppMobileListRssFeed[];
  embedded?: boolean;
};

const initialFormState: AppMobileFormState = {};

function ToggleSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition",
        checked ? "border-(--portal-primary) bg-(--portal-primary)" : "border-zinc-200 bg-zinc-200/70",
        disabled ? "opacity-50" : "hover:brightness-[0.98]",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--portal-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-white",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-block size-4 rounded-full bg-white shadow-sm transition",
          checked ? "translate-x-4" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function RssFeedCreateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createAppMobileRssFeedAction, initialFormState);

  useEffect(() => {
    if (state.ok) {
      onClose();
      router.refresh();
    }
  }, [state.ok, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} title="Thêm nguồn RSS">
      <form action={formAction} className="space-y-4">
        <label className="block text-sm font-medium text-zinc-800">
          Tiêu đề trên app
          <input
            name="label"
            type="text"
            required
            placeholder="Tin tức – Sự kiện"
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-800">
          URL RSS
          <input
            name="feedUrl"
            type="url"
            required
            placeholder="https://example.com/feed.rss"
            className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-(--portal-primary) px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Đang lưu…" : "Thêm"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AppMobileRssPanel({ canEdit, feeds, embedded = false }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);

  const run = (fn: () => Promise<void>) => {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  };

  return (
    <section className={embedded ? undefined : "rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Nguồn RSS</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Các nguồn đang bật sẽ hiển thị khối tin trên trang chủ app.
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="shrink-0 rounded-lg bg-(--portal-primary) px-3 py-2 text-sm font-semibold text-white shadow-sm"
          >
            Thêm RSS
          </button>
        ) : null}
      </div>

      {feeds.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
          Chưa có nguồn RSS. Thêm link feed để app hiển thị tin tức.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          {feeds.map((feed, idx) => (
            <li key={feed.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-zinc-900">{feed.label}</p>
                <p className="mt-0.5 truncate text-xs text-zinc-500">{feed.feedUrl}</p>
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                {canEdit ? (
                  <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
                    <button
                      type="button"
                      disabled={pending || idx <= 0}
                      onClick={() => run(() => moveAppMobileRssFeedServer(feed.id, "up"))}
                      className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                      title="Lên trên"
                      aria-label="Lên trên"
                    >
                      <ChevronUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pending || idx >= feeds.length - 1}
                      onClick={() => run(() => moveAppMobileRssFeedServer(feed.id, "down"))}
                      className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                      title="Xuống dưới"
                      aria-label="Xuống dưới"
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </div>
                ) : null}

                <ToggleSwitch
                  checked={feed.isActive}
                  disabled={!canEdit || pending}
                  onChange={(next) => run(() => setAppMobileRssFeedActiveServer(feed.id, next))}
                  label="Hiển thị trên app"
                />

                {canEdit ? (
                  <form action={deleteAppMobileRssFeedFormAction}>
                    <input type="hidden" name="id" value={feed.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md p-2 text-red-700 hover:bg-red-50"
                      title="Xóa"
                      aria-label="Xóa"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <RssFeedCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </section>
  );
}
