"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  saveUserModulePermissions,
  type SaveUserModulePermissionsState,
} from "@/app/actions/user-module-permissions";
import { CMS_MODULES, type CmsModuleKey } from "@/lib/cms-modules";
import { cn } from "@/lib/utils";

type Row = { moduleKey: CmsModuleKey; canRead: boolean; canEdit: boolean };
type Level = "none" | "read" | "edit";

const actionInitial: SaveUserModulePermissionsState = {};

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

export function UserModulePermissionsForm(props: { userId: string; permissionsJson: string }) {
  const initialRows = useMemo(() => {
    return JSON.parse(props.permissionsJson) as Row[];
  }, [props.permissionsJson]);

  const [state, formAction, pending] = useActionState(saveUserModulePermissions, actionInitial);
  const [levels, setLevels] = useState<Record<CmsModuleKey, Level>>(() => levelsFromRows(initialRows));

  useEffect(() => {
    setLevels(levelsFromRows(initialRows));
  }, [initialRows]);

  const choices: { value: Level; label: string }[] = [
    { value: "none", label: "Không" },
    { value: "read", label: "Quyền đọc" },
    { value: "edit", label: "Quyền chỉnh sửa" },
  ];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="userId" value={props.userId} />

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
                  className={cn(
                    "flex cursor-pointer items-center gap-2 text-sm text-zinc-700 transition-all duration-200 active:scale-95",
                  )}
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

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-xl bg-(--portal-primary) px-4 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95 disabled:opacity-60"
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
