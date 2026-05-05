"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toggleCmsUserActive, type ToggleCmsUserActiveState } from "@/app/actions/cms-users";
import { cn } from "@/lib/utils";

const initial: ToggleCmsUserActiveState = {};

type Props = {
  userId: string;
  isActive: boolean;
  labelMode?: "short" | "long";
};

export function ToggleUserActiveButton(props: Props) {
  const { userId, isActive, labelMode = "short" } = props;
  const router = useRouter();
  const [state, formAction, pending] = useActionState(toggleCmsUserActive, initial);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={formAction} className="inline-flex shrink-0 flex-col items-center gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="nextActive" value={isActive ? "0" : "1"} />
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "inline-flex min-w-[4.5rem] cursor-pointer items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-transform active:scale-[0.98] disabled:opacity-60",
          isActive
            ? "border border-red-200 bg-red-50 text-red-900 hover:bg-red-100"
            : "border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
        )}
      >
        {pending
          ? "…"
          : labelMode === "long"
            ? isActive
              ? "Vô hiệu hóa"
              : "Kích hoạt"
            : isActive
              ? "Vô hiệu"
              : "Kích hoạt"}
      </button>
      {state.error ? (
        <span className="text-center text-[11px] leading-snug text-red-600" role="status">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
