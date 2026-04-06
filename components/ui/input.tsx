import * as React from "react";

import { cn } from "@/lib/utils";

const inputClassName =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors outline-none selection:bg-primary/20 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground placeholder:text-muted-foreground hover:border-input/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/25 dark:bg-input/30 dark:aria-invalid:ring-destructive/40 md:text-sm";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(inputClassName, className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

type InputFieldProps = React.ComponentProps<typeof Input> & {
  label: React.ReactNode;
  /** Mô tả ngắn phía dưới label */
  hint?: string;
  /** Thông báo lỗi (đặt aria-invalid) */
  error?: string;
  className?: string;
};

/**
 * Ô nhập + label + gợi ý / lỗi — dùng chung cho form CMS.
 */
function InputField({ label, hint, error, id, className, required, ...inputProps }: InputFieldProps) {
  const uid = React.useId();
  const inputId = id ?? uid;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-medium leading-none text-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <Input
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {error ? (
        <p id={errId} className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export { Input, InputField, inputClassName };
