import { SITE } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-[var(--portal-border)] bg-[var(--portal-surface)] text-zinc-600">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="font-medium text-zinc-800">{SITE.title}</p>
        <p className="mt-1 text-sm">{SITE.description}</p>
      </div>
      <div className="border-t border-zinc-200 bg-zinc-100/80 py-3 text-center text-xs text-zinc-500">
        © {year} {SITE.shortTitle} — chỉ dùng nội bộ.
      </div>
    </footer>
  );
}
