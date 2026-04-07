"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type NewsCategoryOption = { id: string; title: string };

type Props = {
  categories: NewsCategoryOption[];
  disabled?: boolean;
  /** Khi sửa bài — id danh mục hiện tại. */
  initialCategoryId?: string | null;
};

export function NewsCategoryPicker({ categories, disabled, initialCategoryId }: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [categoryId, setCategoryId] = React.useState(initialCategoryId ?? "");
  const [newTitle, setNewTitle] = React.useState("");

  React.useEffect(() => {
    setCategoryId(initialCategoryId ?? "");
    setNewTitle("");
  }, [initialCategoryId]);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = categories.filter((c) => c.title.toLowerCase().includes(normalizedSearch));

  const displayLabel = React.useMemo(() => {
    if (newTitle.trim()) return `Mới: ${newTitle.trim()}`;
    if (categoryId) {
      const c = categories.find((x) => x.id === categoryId);
      return c?.title ?? "Đã chọn";
    }
    return "Chọn danh mục";
  }, [categories, categoryId, newTitle]);

  function pickExisting(id: string) {
    setCategoryId(id);
    setNewTitle("");
    setOpen(false);
    setSearch("");
  }

  function pickCreateFromSearch() {
    const t = search.trim();
    if (!t) return;
    setNewTitle(t);
    setCategoryId("");
    setOpen(false);
    setSearch("");
  }

  const exactMatch = categories.some((c) => c.title.toLowerCase() === normalizedSearch);
  const canCreateFromSearch = normalizedSearch.length > 0 && !exactMatch;

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="categoryId" value={newTitle.trim() ? "" : categoryId} />
      <input type="hidden" name="newCategoryTitle" value={categoryId ? "" : newTitle.trim()} />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-9 w-full justify-between font-normal text-foreground"
          >
            <span className="truncate text-left">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[min(calc(100vw-2rem),24rem)] max-w-none p-0 sm:w-80"
        >
          <div className="border-b border-border p-2">
            <Input
              placeholder="Tìm hoặc gõ tên mới…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
              disabled={disabled}
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.map((c) => {
              const selected = c.id === categoryId && !newTitle.trim();
              return (
                <button
                  key={c.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                    selected && "bg-muted",
                  )}
                  onClick={() => pickExisting(c.id)}
                  disabled={disabled}
                >
                  <Check className={cn("size-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{c.title}</span>
                </button>
              );
            })}
            {canCreateFromSearch ? (
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-muted"
                onClick={pickCreateFromSearch}
                disabled={disabled}
              >
                <Plus className="size-4 shrink-0" />
                <span className="truncate">Tạo danh mục «{search.trim()}»</span>
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      
    </div>
  );
}
