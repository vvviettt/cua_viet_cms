"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

export function AppMobileOrderArrows({
  disabled,
  canUp,
  canDown,
  onUp,
  onDown,
}: {
  disabled: boolean;
  canUp: boolean;
  canDown: boolean;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        disabled={disabled || !canUp}
        onClick={onUp}
        className="rounded border border-zinc-200 bg-white p-1 text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        title="Lên trên"
        aria-label="Lên trên"
      >
        <ChevronUp className="size-4" />
      </button>
      <button
        type="button"
        disabled={disabled || !canDown}
        onClick={onDown}
        className="rounded border border-zinc-200 bg-white p-1 text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        title="Xuống dưới"
        aria-label="Xuống dưới"
      >
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}
