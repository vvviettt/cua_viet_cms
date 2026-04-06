type Props = {
  defaultQuery: string;
};

export function FeedbackSearchForm({ defaultQuery }: Props) {
  return (
    <form method="get" action="/phan-anh-kien-nghi" className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <label htmlFor="feedback-search-q" className="mb-1 block text-sm font-medium text-zinc-700">
          Tìm theo tiêu đề, nội dung hoặc người gửi
        </label>
        <input
          id="feedback-search-q"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder="Từ khóa…"
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-(--portal-primary) focus:outline-none focus:ring-2 focus:ring-(--portal-primary)/25"
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
            href="/phan-anh-kien-nghi"
            className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-400"
          >
            Xóa lọc
          </a>
        ) : null}
      </div>
    </form>
  );
}
