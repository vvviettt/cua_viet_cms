"use client";

import { useState } from "react";

const fieldClass =
  "w-full max-w-[140px] rounded-lg border border-zinc-300 bg-white px-2 py-1.5 font-mono text-sm text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

/** Chuẩn hóa thành #RRGGBB cho input type=color. */
export function normalizePickerHex(raw: string): string {
  const t = raw.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.slice(0, 1) + t.slice(1).toLowerCase();
  return "#1565c0";
}

type Props = {
  name: string;
  label: string;
  defaultHex: string;
  disabled?: boolean;
  helperText?: string;
};

export function AppMobileHexField({ name, label, defaultHex, disabled, helperText }: Props) {
  const [hex, setHex] = useState(() => normalizePickerHex(defaultHex));

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(normalizePickerHex(e.target.value))}
          disabled={disabled}
          className="h-11 w-[52px] cursor-pointer rounded border border-zinc-300 bg-white p-1 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={label}
        />
        <input
          type="text"
          readOnly
          value={hex.toUpperCase()}
          className={fieldClass}
          tabIndex={-1}
          aria-hidden
        />
      </div>
      <input type="hidden" name={name} value={hex.toUpperCase()} />
      {helperText ? <p className="mt-1 text-xs text-zinc-500">{helperText}</p> : null}
    </div>
  );
}
