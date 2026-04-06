type Props = {
  defaultQuery: string;
};

/** Form GET giữ `q` trên URL; không gửi `page` → về trang 1. */
export function StaffSearchForm({ defaultQuery }: Props) {
  return (
    <form method="get" action="/can-bo" className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label htmlFor="staff-search-q" className="mb-1 block text-sm font-medium text-zinc-700">
          Tìm theo tên hoặc chức vụ
        </label>
        <input
          id="staff-search-q"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder="Ví dụ: UBND, kế toán, Nguyễn…"
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-[var(--portal-primary)]/25"
        />
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="submit"
          className="rounded-lg bg-(--portal-primary) px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-(--portal-primary-hover)"
        >
          Tìm kiếm
        </button>
        {defaultQuery.trim() ? (
          <a
            href="/can-bo"
            className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-400"
          >
            Xóa lọc
          </a>
        ) : null}
      </div>
    </form>
  );
}
