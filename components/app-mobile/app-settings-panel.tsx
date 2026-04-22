"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";

import type { AppMobileFormState } from "@/app/actions/app-mobile-config";
import {
  createAppMobileFaqAction,
  deleteAppMobileFaqServer,
  moveAppMobileFaqServer,
  updateAppMobileFaqAction,
  updateAppMobileSettingsAction,
} from "@/app/actions/app-mobile-settings";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { AppEditorJsField, type EditorJsHandle } from "@/components/app-mobile/app-editorjs-field";

type TabId = "general" | "content" | "faqs";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

type Props = {
  canEdit: boolean;
  defaultAllowCitizenRegister: boolean;
  defaultSupportHotline: string | null;
  defaultUsageGuideJson: string | null;
  defaultTermsJson: string | null;
  faqs: FaqItem[];
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

function clampText(s: string, n: number) {
  const t = (s ?? "").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n).trimEnd()}…`;
}

export function AppSettingsPanel({
  canEdit,
  defaultAllowCitizenRegister,
  defaultSupportHotline,
  defaultUsageGuideJson,
  defaultTermsJson,
  faqs,
  embedded = false,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("general");

  const [allowCitizenRegister, setAllowCitizenRegister] = useState(defaultAllowCitizenRegister);
  const [supportHotline, setSupportHotline] = useState(defaultSupportHotline ?? "");

  const [usageGuideJson, setUsageGuideJson] = useState(defaultUsageGuideJson ?? '{"blocks":[]}');
  const [termsJson, setTermsJson] = useState(defaultTermsJson ?? '{"blocks":[]}');

  const usageRef = useRef<EditorJsHandle | null>(null);
  const termsRef = useRef<EditorJsHandle | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const [state, formAction, pending] = useActionState(updateAppMobileSettingsAction, initialFormState);

  useEffect(() => {
    if (!state?.ok) return;
    const t = window.setTimeout(() => router.refresh(), 400);
    return () => window.clearTimeout(t);
  }, [state?.ok, router]);

  const onSave = async () => {
    if (!canEdit || pending) return;

    // Save editors (if mounted)
    try {
      const u = usageRef.current ? await usageRef.current.save() : null;
      const t = termsRef.current ? await termsRef.current.save() : null;
      if (u) setUsageGuideJson(JSON.stringify(u));
      if (t) setTermsJson(JSON.stringify(t));
    } catch {
      // ignore; submit will keep last JSON
    }

    queueMicrotask(() => formRef.current?.requestSubmit());
  };

  const tabsUi = useMemo(
    () => [
      { id: "general" as const, label: "Cấu hình chung", hint: "Đăng ký & hotline" },
      { id: "content" as const, label: "Nội dung", hint: "Hướng dẫn & điều khoản" },
      { id: "faqs" as const, label: "FAQs", hint: "Câu hỏi thường gặp" },
    ],
    [],
  );

  // FAQ UI
  const [faqCreateOpen, setFaqCreateOpen] = useState(false);
  const [faqEdit, setFaqEdit] = useState<FaqItem | null>(null);
  const [faqPending, startFaqTransition] = useTransition();

  const onMoveFaq = (id: string, direction: "up" | "down") => {
    startFaqTransition(async () => {
      await moveAppMobileFaqServer(id, direction);
      router.refresh();
    });
  };

  const onDeleteFaq = (id: string) => {
    startFaqTransition(async () => {
      await deleteAppMobileFaqServer(id);
      router.refresh();
    });
  };

  return (
    <section className={embedded ? "rounded-xl border-0 bg-transparent p-0 shadow-none" : "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Cài đặt ứng dụng</h2>
          <p className="mt-1 text-sm text-zinc-600">Quản lý đăng ký, hotline, nội dung và FAQs.</p>
        </div>

        <Button onClick={onSave} disabled={!canEdit || pending} className="h-9 bg-(--portal-primary) px-4 text-white hover:bg-(--portal-primary-hover)">
          {pending ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
      </div>

      {state?.error ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Đã lưu.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-full rounded-xl border border-zinc-200 bg-zinc-50 p-1 sm:w-auto">
          {tabsUi.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={[
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition sm:flex-none",
                  active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900",
                ].join(" ")}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-zinc-500">{tabsUi.find((t) => t.id === tab)?.hint}</p>
      </div>

      <form ref={formRef} action={formAction} className="mt-5">
        <input type="hidden" name="allowCitizenRegister" value={allowCitizenRegister ? "true" : "false"} />
        <input type="hidden" name="supportHotline" value={supportHotline} />
        <input type="hidden" name="usageGuideJson" value={usageGuideJson} />
        <input type="hidden" name="termsJson" value={termsJson} />

        {tab === "general" ? (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">Đăng ký mới</p>
                  <p className="mt-1 text-sm text-zinc-600">Bật để cho phép tạo tài khoản công dân.</p>
                </div>
                <ToggleSwitch
                  checked={allowCitizenRegister}
                  disabled={!canEdit || pending}
                  onChange={setAllowCitizenRegister}
                  label="Cho phép đăng ký người dùng mới"
                />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <InputField
                label="Hotline hỗ trợ"
                name="supportHotlineUi"
                type="tel"
                inputMode="numeric"
                placeholder="Ví dụ 0912345678"
                disabled={!canEdit || pending}
                value={supportHotline}
                onChange={(e) => setSupportHotline(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>
        ) : null}

        {tab === "content" ? (
          <div className="space-y-6">
            <div>
              <div className="mb-2">
                <p className="text-sm font-semibold text-zinc-900">Hướng dẫn sử dụng</p>
              </div>
              <AppEditorJsField
                initialJson={defaultUsageGuideJson}
                editorRef={usageRef}
                placeholder="Viết hướng dẫn…"
              />
            </div>

            <div>
              <div className="mb-2">
                <p className="text-sm font-semibold text-zinc-900">Chính sách & điều khoản</p>
              </div>
              <AppEditorJsField
                initialJson={defaultTermsJson}
                editorRef={termsRef}
                placeholder="Viết điều khoản…"
              />
            </div>
          </div>
        ) : null}

        {tab === "faqs" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-zinc-900">Danh sách câu hỏi</p>
              {canEdit ? (
                <Button variant="outline" size="sm" type="button" onClick={() => setFaqCreateOpen(true)}>
                  <Plus className="mr-1.5 size-4" />
                  Thêm câu hỏi
                </Button>
              ) : null}
            </div>

            {faqs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
                Chưa có câu hỏi.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
                  <div>Nội dung</div>
                  <div className="text-right">Thao tác</div>
                </div>
                <ul className="divide-y divide-zinc-200 p-0">
                  {faqs.map((f, idx) => (
                    <li key={f.id} className="px-4 py-3">
                      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">{f.question}</p>
                          <p className="mt-1 text-sm text-zinc-600">{clampText(f.answer, 140)}</p>
                          <p className="mt-2 text-xs text-zinc-500">{f.isActive ? "Đang hiển thị" : "Đang ẩn"}</p>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          {canEdit ? (
                            <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1">
                              <button
                                type="button"
                                disabled={faqPending || idx <= 0}
                                onClick={() => onMoveFaq(f.id, "up")}
                                className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Lên trên"
                                aria-label="Lên trên"
                              >
                                <ChevronUp className="size-4" />
                              </button>
                              <button
                                type="button"
                                disabled={faqPending || idx >= faqs.length - 1}
                                onClick={() => onMoveFaq(f.id, "down")}
                                className="inline-flex items-center justify-center rounded-md p-1.5 text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Xuống dưới"
                                aria-label="Xuống dưới"
                              >
                                <ChevronDown className="size-4" />
                              </button>
                            </div>
                          ) : null}

                          {canEdit ? (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setFaqEdit(f)}
                                title="Sửa"
                                aria-label="Sửa"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon-sm"
                                onClick={() => onDeleteFaq(f.id)}
                                disabled={faqPending}
                                title="Xóa"
                                aria-label="Xóa"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}
      </form>

      <FaqCreateModal
        open={faqCreateOpen}
        onClose={() => setFaqCreateOpen(false)}
        canEdit={canEdit}
      />
      <FaqEditModal
        open={!!faqEdit}
        onClose={() => setFaqEdit(null)}
        canEdit={canEdit}
        initial={faqEdit}
      />
    </section>
  );
}

function FaqCreateModal({ open, onClose, canEdit }: { open: boolean; onClose: () => void; canEdit: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createAppMobileFaqAction, initialFormState);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    onClose();
  }, [state?.ok, onClose, router]);

  return (
    <Modal open={open} onClose={onClose} title="Thêm câu hỏi" maxWidthClassName="max-w-xl">
      {state?.error ? (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state.error}
        </p>
      ) : null}
      <form action={action} className="space-y-4">
        <InputField label="Câu hỏi" name="question" disabled={!canEdit || pending} required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium leading-none text-foreground">Trả lời</label>
          <textarea
            name="answer"
            required
            disabled={!canEdit || pending}
            className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50"
          />
        </div>
        <input type="hidden" name="isActive" value="true" />
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={!canEdit || pending} className="bg-(--portal-primary) text-white hover:bg-(--portal-primary-hover)">
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FaqEditModal({
  open,
  onClose,
  canEdit,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  initial: FaqItem | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(updateAppMobileFaqAction, initialFormState);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    onClose();
  }, [state?.ok, onClose, router]);

  if (!open || !initial) return null;

  return (
    <Modal open={open} onClose={onClose} title="Sửa câu hỏi" maxWidthClassName="max-w-xl">
      {state?.error ? (
        <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state.error}
        </p>
      ) : null}
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={initial.id} />
        <InputField label="Câu hỏi" name="question" defaultValue={initial.question} disabled={!canEdit || pending} required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium leading-none text-foreground">Trả lời</label>
          <textarea
            name="answer"
            required
            defaultValue={initial.answer}
            disabled={!canEdit || pending}
            className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50"
          />
        </div>
        <input type="hidden" name="isActive" value={initial.isActive ? "true" : "false"} />
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" disabled={!canEdit || pending} className="bg-(--portal-primary) text-white hover:bg-(--portal-primary-hover)">
            {pending ? "Đang lưu…" : "Lưu"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

