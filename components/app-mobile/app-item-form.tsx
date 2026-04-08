"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAppMobileItemAction,
  updateAppMobileItemAction,
  type AppMobileFormState,
} from "@/app/actions/app-mobile-config";
import { APP_MOBILE_NATIVE_ROUTE_IDS } from "@/lib/app-mobile-native-routes";
import { AppMobileHexField } from "./app-mobile-hex-field";
import { AppMobileIconPicker } from "./app-mobile-icon-picker";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: AppMobileFormState = {};

type CreateProps = {
  mode: "create";
  canEdit: boolean;
  sectionId: string;
};

type EditProps = {
  mode: "edit";
  canEdit: boolean;
  itemId: string;
  defaultKind: "native" | "webview";
  defaultRouteId: string;
  defaultWebUrl: string;
  defaultLabel: string;
  defaultIconKey: string;
  defaultAccentHex: string;
};

type Props = CreateProps | EditProps;

export function AppItemForm(props: Props) {
  const router = useRouter();
  const action = props.mode === "create" ? createAppMobileItemAction : updateAppMobileItemAction;
  const [state, formAction, pending] = useActionState(action, initial);

  const isEdit = props.mode === "edit";
  const initialKind: "native" | "webview" = isEdit ? props.defaultKind : "native";
  const [kind, setKind] = useState<"native" | "webview">(initialKind);

  useEffect(() => {
    if (!state?.ok) return;
    router.push("/cau-hinh-app?tab=menu");
  }, [state?.ok, router]);

  if (!props.canEdit) {
    return <p className="text-sm text-zinc-600">Không có quyền chỉnh sửa.</p>;
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-4">
      {props.mode === "create" ? <input type="hidden" name="sectionId" value={props.sectionId} /> : null}
      {isEdit ? <input type="hidden" name="itemId" value={props.itemId} /> : null}

      {state?.error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state.error}
        </p>
      ) : null}

      

      <div>
        <label htmlFor="item-kind" className="mb-1 block text-sm font-medium text-zinc-700">
          Loại
        </label>
        <select
          id="item-kind"
          name="kind"
          required
          disabled={pending}
          value={kind}
          onChange={(e) => setKind(e.target.value === "webview" ? "webview" : "native")}
          className={fieldClass}
        >
          <option value="native">Màn hình trong app (route cố định)</option>
          <option value="webview">Liên kết web (WebView)</option>
        </select>
      </div>

      {kind === "native" ? (
        <div>
          <label htmlFor="item-route" className="mb-1 block text-sm font-medium text-zinc-700">
            Route trong app <span className="text-red-600">*</span>
          </label>
          <select
            id="item-route"
            name="routeId"
            required
            disabled={pending}
            defaultValue={isEdit ? props.defaultRouteId : "none"}
            className={fieldClass}
          >
            {APP_MOBILE_NATIVE_ROUTE_IDS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} ({r.id})
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-500">Chọn màn hình có sẵn trong ứng dụng.</p>
        </div>
      ) : (
        <div>
          <label htmlFor="item-url" className="mb-1 block text-sm font-medium text-zinc-700">
            Liên kết web <span className="text-red-600">*</span>
          </label>
          <input
            id="item-url"
            name="webUrl"
            type="url"
            required
            disabled={pending}
            defaultValue={isEdit ? props.defaultWebUrl : ""}
            className={fieldClass}
            placeholder="https://…"
          />
          <p className="mt-1 text-xs text-zinc-500">URL đầy đủ, mở trong WebView trong app.</p>
        </div>
      )}

      <div>
        <label htmlFor="item-label" className="mb-1 block text-sm font-medium text-zinc-700">
          Nhãn hiển thị <span className="text-red-600">*</span>
        </label>
        <input
          id="item-label"
          name="label"
          type="text"
          required
          maxLength={120}
          disabled={pending}
          defaultValue={isEdit ? props.defaultLabel : ""}
          className={fieldClass}
        />
      </div>

      <AppMobileIconPicker
        name="iconKey"
        defaultKey={isEdit ? props.defaultIconKey : "help_outline"}
        disabled={pending}
      />

      <AppMobileHexField
        name="accentHex"
        label="Màu nhấn (ô icon)"
        defaultHex={isEdit ? props.defaultAccentHex : "#1565C0"}
        disabled={pending}
      />

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
      >
        {pending ? "Đang lưu…" : "Lưu"}
      </button>
    </form>
  );
}
