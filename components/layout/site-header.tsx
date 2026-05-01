import Link from "next/link";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { logout } from "@/app/actions/auth";
const nav = [
  { href: "/", label: "Bảng điều khiển" },
];

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="border-b border-(--portal-border) bg-(--portal-header) text-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Link href="/" className="group flex gap-3 sm:min-w-0 sm:flex-1">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 text-lg font-bold ring-1 ring-white/20"
            aria-hidden
          >
            CV
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-medium text-white/90">{SITE.headerLine1}</span>
            <span className="mt-0.5 block text-base font-semibold tracking-tight text-white sm:text-lg">
              {SITE.headerLine2}
            </span>
            <span className="mt-0.5 block text-[11px] text-white/75">Quản trị nội bộ</span>
          </span>
        </Link>

        <nav
          className="flex flex-wrap items-center gap-x-1 gap-y-2 text-sm font-medium"
          aria-label="Điều hướng quản trị"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md bg-[var(--portal-nav)] px-3 py-2 text-white transition hover:bg-[var(--portal-nav-hover)] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {session ? (
            <>
              <span className="max-w-[220px] truncate text-sm text-white/90 sm:max-w-[280px]">
                <span className="block truncate font-medium">{session.name ?? session.email}</span>
                <span className="block truncate text-xs text-white/70">
                  {session.isAdmin ? "Quản trị viên" : "CMS"}
                </span>
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-md border border-white/30 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
                >
                  Đăng xuất
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/dang-nhap"
              className="rounded-md bg-[var(--portal-accent)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--portal-accent-hover)]"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
      <div className="sr-only">{SITE.title}</div>
    </header>
  );
}
