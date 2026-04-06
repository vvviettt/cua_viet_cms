import { SITE } from "@/lib/constants";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--portal-surface)]">
      <header className="shrink-0 border-b border-[var(--portal-border)] bg-[var(--portal-header)] px-4 py-4 text-center shadow-sm sm:py-5">
        <p className="text-sm font-medium text-white/90">{SITE.headerLine1}</p>
        <p className="mt-1 text-base font-semibold text-white sm:text-lg">{SITE.headerLine2}</p>
        <p className="mt-2 text-xs text-white/80 sm:text-sm">
          Đăng nhập dành cho cán bộ, nhân viên
        </p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
