"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAppMobileHomeBannerSectionAction,
  updateAppMobileHomeBannerSectionAction,
  type AppMobileFormState,
} from "@/app/actions/app-mobile-config";
import { APP_MOBILE_NATIVE_ROUTE_IDS } from "@/lib/app-mobile-native-routes";
import { FileLocalPickRow, FileSourcePicker } from "@/components/ui/file-source-picker";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25";

const initial: AppMobileFormState = {};

type CreateProps = { mode: "create"; canEdit: boolean; ctaKey: "apply_online" | "lookup_result" };
type SectionKind = "native" | "webview" | "file";

type EditProps = {
  mode: "edit";
  canEdit: boolean;
  ctaKey: "apply_online" | "lookup_result";
  sectionId: string;
  defaultTitle: string;
  defaultKind: SectionKind;
  defaultRouteId: string;
  defaultWebUrl: string;
  defaultDocumentPreviewSrc?: string | null;
  defaultDocumentName?: string | null;
  defaultIconUrl?: string | null;
  defaultIconDisplayName?: string | null;
};

type Props = CreateProps | EditProps;

export function AppHomeBannerSectionForm(props: Props) {
  const router = useRouter();
  const action = props.mode === "create" ? createAppMobileHomeBannerSectionAction : updateAppMobileHomeBannerSectionAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (!state?.ok) return;
    router.push("/cau-hinh-app/trang-chu");
  }, [state?.ok, router]);

  const isEdit = props.mode === "edit";
  const initialKind: SectionKind = isEdit ? props.defaultKind : "native";
  const [kind, setKind] = useState<SectionKind>(initialKind);
  const [pickedDocumentFile, setPickedDocumentFile] = useState<File | null>(null);
  const defaultIconUrl = isEdit ? props.defaultIconUrl ?? null : null;
  const defaultIconDisplayName = isEdit ? props.defaultIconDisplayName ?? null : null;
  const hasExistingDocument = isEdit ? Boolean(props.defaultDocumentPreviewSrc) : false;
  const needsDocument = kind === "file";
  const hasDocument = Boolean(pickedDocumentFile) || hasExistingDocument;

  if (!props.canEdit) {
    return <p className="text-sm text-zinc-600">Không có quyền chỉnh sửa.</p>;
  }

  const canSubmit = pending ? false : hasDocument || !needsDocument;

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-4">
      <input type="hidden" name="ctaKey" value={props.ctaKey} />
      {isEdit ? <input type="hidden" name="sectionId" value={props.sectionId} /> : null}
      {state?.error ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900" role="alert">
          {state.error}
        </p>
      ) : null}

      <div>
        <label htmlFor="sec-title" className="mb-1 block text-sm font-medium text-zinc-700">
          Tên nhóm <span className="text-red-600">*</span>
        </label>
        <input
          id="sec-title"
          name="title"
          type="text"
          required
          maxLength={200}
          disabled={pending}
          defaultValue={isEdit ? props.defaultTitle : undefined}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="cta-kind" className="mb-1 block text-sm font-medium text-zinc-700">
          Loại link của nhóm <span className="text-red-600">*</span>
        </label>
        <select
          id="cta-kind"
          name="kind"
          required
          disabled={pending}
          value={kind}
          onChange={(e) => {
            const v = e.target.value;
            setKind(v === "webview" ? "webview" : v === "file" ? "file" : "native");
          }}
          className={fieldClass}
        >
          <option value="native">Màn hình trong app (route cố định)</option>
          <option value="webview">Liên kết web (WebView)</option>
          <option value="file">Tệp PDF / Word / Excel</option>
        </select>
      </div>

      {kind === "native" ? (
        <div>
          <label htmlFor="cta-route" className="mb-1 block text-sm font-medium text-zinc-700">
            Route trong app <span className="text-red-600">*</span>
          </label>
          <select
            id="cta-route"
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
        </div>
      ) : kind === "webview" ? (
        <div>
          <label htmlFor="cta-url" className="mb-1 block text-sm font-medium text-zinc-700">
            Liên kết web <span className="text-red-600">*</span>
          </label>
          <input
            id="cta-url"
            name="webUrl"
            type="url"
            required
            disabled={pending}
            defaultValue={isEdit ? props.defaultWebUrl : ""}
            className={fieldClass}
            placeholder="https://…"
          />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            Tệp đính kèm <span className="text-red-600">*</span>
          </label>
          <FileLocalPickRow
            id="sec-document-file"
            name="documentFile"
            accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            disabled={pending}
            onFileChange={setPickedDocumentFile}
            title="Upload tài liệu"
            emptyLabel="Chưa chọn tệp…"
            buttonLabel="Chọn tệp"
            existingDisplayName={
              isEdit && props.defaultDocumentName
                ? props.defaultDocumentName
                : isEdit && props.defaultDocumentPreviewSrc
                  ? "Tệp hiện tại"
                  : null
            }
            existingFileHref={isEdit ? (props.defaultDocumentPreviewSrc ?? undefined) : undefined}
            existingFileLinkLabel="Mở tệp"
          />
          <p className="mt-1 text-xs text-zinc-500">PDF, Word hoặc Excel. Lưu trên Supabase Storage.</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-3">
        <p className="text-sm font-semibold text-zinc-900">
          Icon nhóm <span className="text-red-600">*</span>
        </p>
        <p className="mt-1 text-xs text-zinc-600">Chỉ nhận SVG, tối đa 512KB.</p>

        <div className="mt-3">
          <FileSourcePicker
            mode="local-only"
            disabled={pending}
            localName="iconFile"
            localAccept=".svg,image/svg+xml"
            localTitle="Upload icon (SVG)"
            localEmptyLabel="Chưa chọn icon…"
            localButtonLabel="Chọn SVG"
          />
          {defaultIconUrl ? (
            <p className="mt-2 text-xs text-zinc-600">
              Icon hiện tại:{" "}
              <a
                href={defaultIconUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-(--portal-primary) underline underline-offset-2 hover:underline"
              >
                {defaultIconDisplayName?.trim() || "Xem"}
              </a>
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-zinc-700">
              Bạn cần chọn icon SVG cho nhóm trước khi lưu.
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-fit rounded-lg bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover) disabled:opacity-60"
      >
        {pending ? "Đang lưu…" : "Lưu"}
      </button>
    </form>
  );
}

