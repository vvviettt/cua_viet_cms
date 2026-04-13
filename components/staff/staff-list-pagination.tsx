import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { buttonSurfaces } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_PARAM = "page";
const Q_PARAM = "q";

export function buildStaffListUrl(path: string, opts: { page?: number; q?: string }): string {
  const sp = new URLSearchParams();
  const qt = opts.q?.trim();
  if (qt) sp.set(Q_PARAM, qt);
  if (opts.page != null && opts.page > 1) sp.set(PAGE_PARAM, String(opts.page));
  const s = sp.toString();
  return s ? `${path}?${s}` : path;
}

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev > 0 && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

type Props = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  searchQuery: string;
};

export function StaffListPagination({
  basePath,
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  searchQuery,
}: Props) {
  if (totalItems === 0) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);
  const pages = pageWindow(currentPage, totalPages);
  const q = searchQuery.trim();
  const showNumberLinks = totalPages > 1;

  return (
    <div className="mt-8 flex flex-col items-center gap-4 border-t border-zinc-200 pt-6">
      <p className="text-center text-sm text-zinc-600">
        Hiển thị{" "}
        <span className="font-medium text-zinc-800">
          {from}–{to}
        </span>{" "}
        trong tổng{" "}
        <span className="font-medium text-zinc-800">{totalItems}</span> cán bộ
      </p>
      {showNumberLinks ? (
        <Pagination>
          <PaginationContent className="flex-wrap justify-center gap-1">
            <PaginationItem>
              {currentPage <= 1 ? (
                <span
                  className={cn(
                    buttonSurfaces({ variant: "ghost", size: "default" }),
                    "pointer-events-none gap-1 pl-1.5 opacity-40",
                  )}
                  aria-disabled
                >
                  <ChevronLeft className="size-4 shrink-0" aria-hidden />
                  <span className="hidden sm:inline">Trước</span>
                </span>
              ) : (
                <PaginationPrevious
                  href={buildStaffListUrl(basePath, { page: currentPage - 1, q })}
                  text="Trước"
                />
              )}
            </PaginationItem>
            {pages.map((entry, i) =>
              entry === "ellipsis" ? (
                <PaginationItem key={`e-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={entry}>
                  <PaginationLink
                    href={buildStaffListUrl(basePath, { page: entry, q })}
                    isActive={entry === currentPage}
                    size="icon"
                    className="min-w-9"
                  >
                    {entry}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              {currentPage >= totalPages ? (
                <span
                  className={cn(
                    buttonSurfaces({ variant: "ghost", size: "default" }),
                    "pointer-events-none gap-1 pr-1.5 opacity-40",
                  )}
                  aria-disabled
                >
                  <span className="hidden sm:inline">Sau</span>
                  <ChevronRight className="size-4 shrink-0" aria-hidden />
                </span>
              ) : (
                <PaginationNext
                  href={buildStaffListUrl(basePath, { page: currentPage + 1, q })}
                  text="Sau"
                />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
