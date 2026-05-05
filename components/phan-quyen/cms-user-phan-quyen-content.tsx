"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { saveCmsUserPhanQuyen, type SaveCmsUserPhanQuyenState } from "@/app/actions/cms-users";
import type { AdminUserListItem } from "@/lib/db/users";
import { CMS_MODULES, type CmsModuleKey } from "@/lib/cms-modules";
import { cn } from "@/lib/utils";

const actionInitial: SaveCmsUserPhanQuyenState = {};

type Row = { moduleKey: CmsModuleKey; canRead: boolean; canEdit: boolean };
type Level = "none" | "read" | "edit";

function rowToLevel(canRead: boolean, canEdit: boolean): Level {
  if (canEdit) return "edit";
  if (canRead) return "read";
  return "none";
}

function levelsFromRows(rows: Row[]): Record<CmsModuleKey, Level> {
  const m = {} as Record<CmsModuleKey, Level>;
  for (const mod of CMS_MODULES) {
    const r = rows.find((x) => x.moduleKey === mod.key);
    m[mod.key] = rowToLevel(r?.canRead ?? false, r?.canEdit ?? false);
  }
  return m;
}

type Props = {
  user: AdminUserListItem;
  permissionsJson: string;
};

/** Vai trò + module trong một form, một nút Lưu; module chỉ hiện khi chọn Người dùng CMS. */
export function CmsUserPhanQuyenContent(props: Props) {
  const { user, permissionsJson } = props;
  const router = useRouter();

  const initialRows = useMemo(() => JSON.parse(permissionsJson) as Row[], [permissionsJson]);

  const [selectedRole, setSelectedRole] = useState<"admin" | "cms">(() =>
    user.isAdmin ? "admin" : "cms",
  );
  const [levels, setLevels] = useState<Record<CmsModuleKey, Level>>(() => levelsFromRows(initialRows));

  const [state, formAction, pending] = useActionState(saveCmsUserPhanQuyen, actionInitial);

  useEffect(() => {
    setSelectedRole(user.isAdmin ? "admin" : "cms");
    setLevels(levelsFromRows(initialRows));
  }, [user.id, user.isAdmin, user.updatedAt, initialRows]);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const choices: { value: Level; label: string }[] = [
    { value: "none", label: "Không" },
    { value: "read", label: "Quyền đọc" },
    { value: "edit", label: "Quyền chỉnh sửa" },
  ];

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="userId" value={user.id} />

      <section className="space-y-3" aria-labelledby="role-heading">
        <h3 id="role-heading" className="text-sm font-semibold text-zinc-900">
          Vai trò
        </h3>
        <p className="text-sm text-zinc-600">
          Chọn loại tài khoản. Người dùng CMS mới hiện phần phân quyền từng module bên dưới.
        </p>
        <fieldset className="space-y-3">
          <legend className="sr-only">Chọn vai trò</legend>
          <label
            className={cn(
              "flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm transition-colors",
              selectedRole === "cms"
                ? "border-(--portal-primary) bg-white ring-1 ring-(--portal-primary)/20"
                : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300",
            )}
          >
            <input
              type="radio"
              name="cmsRole"
              value="cms"
              checked={selectedRole === "cms"}
              onChange={() => setSelectedRole("cms")}
              className="mt-0.5 h-4 w-4 border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
            />
            <span>
              <span className="font-medium text-zinc-900">Người dùng CMS</span>
              <span className="mt-0.5 block text-zinc-600">Gán quyền đọc/chỉnh sửa theo từng module.</span>
            </span>
          </label>
          <label
            className={cn(
              "flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm transition-colors",
              selectedRole === "admin"
                ? "border-(--portal-primary) bg-white ring-1 ring-(--portal-primary)/20"
                : "border-zinc-200 bg-zinc-50/60 hover:border-zinc-300",
            )}
          >
            <input
              type="radio"
              name="cmsRole"
              value="admin"
              checked={selectedRole === "admin"}
              onChange={() => setSelectedRole("admin")}
              className="mt-0.5 h-4 w-4 border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
            />
            <span>
              <span className="font-medium text-zinc-900">Quản trị viên</span>
              <span className="mt-0.5 block text-zinc-600">Toàn quyền CMS; không gán từng module.</span>
            </span>
          </label>
        </fieldset>
      </section>

      <section className="space-y-3" aria-labelledby="perm-heading">
        <h3 id="perm-heading" className="text-sm font-semibold text-zinc-900">
          Phân quyền theo module
        </h3>
        {selectedRole === "admin" ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-6 text-sm text-zinc-600">
            Không áp dụng cho quản trị viên. Chọn &quot;Người dùng CMS&quot; để hiện danh sách module.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {CMS_MODULES.map((mod) => (
              <li
                key={mod.key}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <span className="text-sm font-medium text-zinc-900">{mod.label}</span>
                <div
                  className="flex flex-wrap gap-4 sm:justify-end"
                  role="radiogroup"
                  aria-label={mod.label}
                >
                  {choices.map((c) => (
                    <label
                      key={c.value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 transition-all duration-200 active:scale-95"
                    >
                      <input
                        type="radio"
                        name={`perm_${mod.key}`}
                        value={c.value}
                        checked={levels[mod.key] === c.value}
                        onChange={() => setLevels((p) => ({ ...p, [mod.key]: c.value }))}
                        className="h-4 w-4 cursor-pointer border-zinc-300 text-(--portal-primary) focus:ring-(--portal-primary)"
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-xl bg-(--portal-primary) px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Đang lưu…" : "Lưu"}
        </button>
        {state.error ? (
          <p className="text-sm text-red-600" role="status">
            {state.error}
          </p>
        ) : null}
        {state.ok ? (
          <p className="text-sm font-medium text-emerald-700" role="status">
            Đã lưu
          </p>
        ) : null}
      </div>
    </form>
  );
}
