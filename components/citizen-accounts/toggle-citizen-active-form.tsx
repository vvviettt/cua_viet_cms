"use client";

import { useActionState } from "react";
import {
  toggleCitizenAccountActive,
  type ToggleCitizenAccountState,
} from "@/app/actions/citizen-accounts";

export function ToggleCitizenActiveForm({
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
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="citizenAccountId" value={citizenAccountId} />
      <input type="hidden" name="nextActive" value={String(nextActive)} />

      <button
        type="submit"
        disabled={pending}
        className={
          "inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition disabled:cursor-not-allowed disabled:opacity-60 " +
          (nextActive
            ? "bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100"
            : "bg-zinc-100 text-zinc-800 ring-zinc-200 hover:bg-zinc-200")
        }
        aria-disabled={pending}
      >
        {pending ? "Đang lưu..." : nextActive ? "Active" : "Inactive"}
      </button>

      {state?.error ? (
        <span className="text-xs font-medium text-red-600">{state.error}</span>
      ) : null}
    </form>
  );
}

