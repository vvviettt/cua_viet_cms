"use client";

import { useEffect, useId, useRef } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Giới hạn chiều rộng nội dung modal. */
  maxWidthClassName?: string;
};

export function Modal({ open, onClose, title, children, maxWidthClassName = "max-w-2xl" }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);

    // Focus modal panel for basic accessibility.
    queueMicrotask(() => panelRef.current?.focus());

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 cursor-default bg-black/35"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full items-center justify-center p-4 sm:p-8">
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`w-full ${maxWidthClassName} overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl outline-none`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
            <h2 id={titleId} className="text-base font-semibold text-zinc-900">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              Đóng
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

