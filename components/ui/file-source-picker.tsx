"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const portalRing = "border-2 border-[var(--portal-primary)]";
const portalFill = "bg-[var(--portal-primary)] text-white hover:bg-[var(--portal-primary-hover)]";

type OrDividerProps = {
  label?: string;
  className?: string;
};

/** Đường kẻ ngang có chữ giữa (vd. hoặc / or). */
export function FilePickerOrDivider({ label = "hoặc", className }: OrDividerProps) {
  return (
    <div className={cn("relative my-6", className)} role="separator">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <span className="h-px w-full bg-border" />
      </div>
      <div className="relative flex justify-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span className="bg-background px-3">{label}</span>
      </div>
    </div>
  );
}

type FileUrlRowProps = {
  id?: string;
  title?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  placeholder?: string;
  buttonLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
};

/**
 * Một hàng: ô URL + nút tải, chung viền bo tròn (kiểu unified input group).
 */
export function FileUrlUploadRow({
  id,
  title = "Tải lên từ URL",
  value,
  onChange,
  onSubmit,
  placeholder = "https://…",
  buttonLabel = "Tải lên",
  disabled,
  loading,
  error,
  className,
}: FileUrlRowProps) {
  const uid = React.useId();
  const inputId = id ?? uid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled || loading) return;
    await onSubmit();
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div
          className={cn(
            "flex min-h-11 overflow-hidden rounded-xl shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-(--portal-primary)/35",
            portalRing,
            error && "border-destructive focus-within:ring-destructive/30",
          )}
        >
          <input
            id={inputId}
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || loading}
            className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={disabled || loading || !value.trim()}
            className={cn(
              "shrink-0 px-5 py-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
              portalFill,
            )}
          >
            {loading ? "Đang xử lý…" : buttonLabel}
          </button>
        </div>
        {error ? (
          <p className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

type FileLocalRowProps = {
  id?: string;
  title?: string;
  accept?: string;
  multiple?: boolean;
  name?: string;
  disabled?: boolean;
  /** Khi chọn file từ máy */
  onFileChange?: (file: File | null) => void;
  emptyLabel?: string;
  buttonLabel?: string;
  className?: string;
  error?: string;
  /** Tên file đang lưu trên server — hiện trong ô khi chưa chọn file mới. */
  existingDisplayName?: string | null;
  /** Mở file hiện tại (vd. PDF) trong tab mới. */
  existingFileHref?: string;
  existingFileLinkLabel?: string;
};

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (value: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(value);
      else if (ref && typeof ref === "object" && "current" in ref) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}

/**
 * Một hàng: tên file (trái) + nút chọn tệp (phải), cùng kiểu viền với URL row.
 * `ref` gắn vào input file (để xóa khi đổi sang URL).
 */
export const FileLocalPickRow = React.forwardRef<HTMLInputElement, FileLocalRowProps>(function FileLocalPickRow(
  {
    id,
    title = "Chọn tệp",
    accept,
    multiple,
    name,
    disabled,
    onFileChange,
    emptyLabel = "Chưa chọn tệp…",
    buttonLabel = "Chọn tệp",
    className,
    error,
    existingDisplayName,
    existingFileHref,
    existingFileLinkLabel = "Xem",
  },
  forwardedRef,
) {
  const innerRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const uid = React.useId();
  const inputId = id ?? uid;

  const labelText = fileName ?? existingDisplayName?.trim() ?? null;
  const showExistingLink = Boolean(existingFileHref && !fileName);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onFileChange?.(file);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="flex flex-col gap-2">
        <div
          className={cn(
            "flex min-h-11 overflow-hidden rounded-xl shadow-sm",
            portalRing,
            error && "border-destructive",
          )}
        >
          <div
            id={`${inputId}-label`}
            className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-4 py-2.5 text-sm"
          >
            <span
              className={cn(
                "truncate",
                labelText ? "font-medium text-foreground" : "text-muted-foreground",
              )}
              title={labelText ?? undefined}
            >
              {labelText ?? emptyLabel}
            </span>
            {showExistingLink ? (
              <a
                href={existingFileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-xs font-semibold text-[var(--portal-primary)] underline-offset-2 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {existingFileLinkLabel}
              </a>
            ) : null}
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => innerRef.current?.click()}
            className={cn(
              "shrink-0 px-5 py-3 text-sm font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
              portalFill,
            )}
          >
            {buttonLabel}
          </button>
        </div>
        <input
          ref={mergeRefs(innerRef, forwardedRef)}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
          aria-labelledby={`${inputId}-label`}
        />
        {error ? (
          <p className="text-xs font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
});
FileLocalPickRow.displayName = "FileLocalPickRow";

type FileUrlFieldRowProps = {
  id?: string;
  name?: string;
  title?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Nhãn khối bên phải (trang trí, giống nút “Upload”) */
  suffix?: string;
  onUrlInput?: React.FormEventHandler<HTMLInputElement>;
};

/**
 * Ô URL nằm trong form: submit chung với nút “Lưu” phía dưới. Khối phải là nhãn PDF (không phải nút riêng).
 */
export const FileUrlFieldRow = React.forwardRef<HTMLInputElement, FileUrlFieldRowProps>(function FileUrlFieldRow(
  {
    id,
    name = "pdfUrl",
    title = "Tải lên từ URL",
    placeholder = "https://…",
    disabled,
    className,
    suffix = "PDF",
    onUrlInput,
  },
  ref,
) {
  const uid = React.useId();
  const inputId = id ?? uid;

  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div
        className={cn(
          "flex min-h-11 overflow-hidden rounded-xl shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-(--portal-primary)/35",
          portalRing,
        )}
      >
        <input
          ref={ref}
          id={inputId}
          name={name}
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder={placeholder}
          disabled={disabled}
          onInput={onUrlInput}
          className="min-w-0 flex-1 border-0 bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        <span
          className={cn(
            "pointer-events-none flex shrink-0 select-none items-center px-5 py-3 text-sm font-semibold",
            portalFill,
          )}
          aria-hidden
        >
          {suffix}
        </span>
      </div>
    </div>
  );
});
FileUrlFieldRow.displayName = "FileUrlFieldRow";

export type FileSourcePickerMode = "both" | "local-only" | "url-only";

export type FileSourcePickerProps = {
  mode?: FileSourcePickerMode;
  className?: string;
  disabled?: boolean;
  /** Thuộc tính input file (để submit form server action) */
  localName?: string;
  localAccept?: string;
  localMultiple?: boolean;
  onLocalFileChange?: (file: File | null) => void;
  localTitle?: string;
  localEmptyLabel?: string;
  localButtonLabel?: string;
  localError?: string;
  urlTitle?: string;
  urlPlaceholder?: string;
  urlButtonLabel?: string;
  /** Gọi khi bấm nút URL (fetch / validate ở ngoài) */
  onUrlSubmit?: (url: string) => void | Promise<void>;
  urlError?: string;
  orLabel?: string;
  /** URL không điều khiển — dùng defaultState */
  defaultUrl?: string;
  controlledUrl?: string;
  onUrlChange?: (url: string) => void;
  urlLoading?: boolean;
};

/**
 * Khối chọn nguồn file dùng chung: máy + (hoặc) + URL — cùng phong cách viền cổng.
 */
export function FileSourcePicker({
  mode = "both",
  className,
  disabled,
  localName,
  localAccept,
  localMultiple,
  onLocalFileChange,
  localTitle,
  localEmptyLabel,
  localButtonLabel,
  localError,
  urlTitle,
  urlPlaceholder,
  urlButtonLabel,
  onUrlSubmit,
  urlError,
  orLabel,
  defaultUrl = "",
  controlledUrl,
  onUrlChange,
  urlLoading,
}: FileSourcePickerProps) {
  const [internalUrl, setInternalUrl] = React.useState(defaultUrl);
  const urlDraft = controlledUrl !== undefined ? controlledUrl : internalUrl;
  const setUrlDraft = (v: string) => {
    onUrlChange?.(v);
    if (controlledUrl === undefined) setInternalUrl(v);
  };

  const showLocal = mode === "both" || mode === "local-only";
  const showUrl = mode === "both" || mode === "url-only";
  const showOr = mode === "both" && showLocal && showUrl;

  return (
    <div className={cn("w-full max-w-2xl", className)}>
      {showLocal ? (
        <FileLocalPickRow
          name={localName}
          accept={localAccept}
          multiple={localMultiple}
          disabled={disabled}
          onFileChange={onLocalFileChange}
          title={localTitle}
          emptyLabel={localEmptyLabel}
          buttonLabel={localButtonLabel}
          error={localError}
        />
      ) : null}
      {showOr ? <FilePickerOrDivider label={orLabel} /> : null}
      {showUrl && onUrlSubmit ? (
        <FileUrlUploadRow
          title={urlTitle}
          value={urlDraft}
          onChange={setUrlDraft}
          onSubmit={() => onUrlSubmit(urlDraft.trim())}
          placeholder={urlPlaceholder}
          buttonLabel={urlButtonLabel}
          disabled={disabled}
          loading={urlLoading}
          error={urlError}
        />
      ) : null}
    </div>
  );
}
