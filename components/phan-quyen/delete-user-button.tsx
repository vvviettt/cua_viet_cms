"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { deleteCmsUser, type DeleteCmsUserState } from "@/app/actions/cms-users";
import { cn } from "@/lib/utils";

const initial: DeleteCmsUserState = {};

type Props = {
  userId: string;
  email: string;
  /** Ẩn nút khi là chính mình (server cũng từ chối). */
  disabled?: boolean;
};

export function DeleteUserButton(props: Props) {
  const { userId, email, disabled } = props;
  const router = useRouter();
  const [state, formAction, pending] = useActionState(deleteCmsUser, initial);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form
      action={formAction}
      className="inline-flex shrink-0 flex-col items-center gap-1"
      onSubmit={(e) => {
        if (!confirm(`Xóa vĩnh viễn tài khoản ${email}? Không thể hoàn tác.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={pending || disabled}
        className={cn(
          "inline-flex min-w-[4.5rem] cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-900 transition-transform hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        {pending ? "…" : "Xóa"}
      </button>
      {state.error ? (
        <span className="mt-1 block max-w-[140px] text-center text-[11px] leading-snug text-red-600" role="status">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
