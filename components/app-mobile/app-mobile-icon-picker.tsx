"use client";

import type { LucideIcon } from "lucide-react";
import {
  Book,
  BookOpen,
  Calendar,
  Car,
  CircleHelp,
  Folder,
  Globe,
  GraduationCap,
  Landmark,
  MessageSquare,
  Newspaper,
  Phone,
  Receipt,
  Search,
  Shield,
  Star,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { APP_MOBILE_ICON_KEYS } from "@/lib/app-mobile-icon-keys";

/** Ánh xạ khóa Flutter/Material → biểu tượng lucide-react (chỉ để chọn & xem trước). */
const LUCIDE_BY_KEY: Record<string, LucideIcon> = {
  calendar_month: Calendar,
  newspaper: Newspaper,
  rate_review: MessageSquare,
  phone_in_talk: Phone,
  star_rounded: Star,
  quiz_outlined: CircleHelp,
  file_upload_outlined: Upload,
  groups_outlined: Users,
  manage_search: Search,
  menu_book_outlined: BookOpen,
  book_outlined: Book,
  health_and_safety_outlined: Shield,
  school_outlined: GraduationCap,
  traffic_outlined: Car,
  receipt_long_outlined: Receipt,
  folder_copy_outlined: Folder,
  public_outlined: Globe,
  account_balance_outlined: Landmark,
  help_outline: CircleHelp,
};

type Props = {
  name: string;
  defaultKey: string;
  disabled?: boolean;
};

export function AppMobileIconPicker({ name, defaultKey, disabled }: Props) {
  const initial =
    APP_MOBILE_ICON_KEYS.some((x) => x.key === defaultKey) ? defaultKey : "help_outline";
  const [selected, setSelected] = useState(initial);

  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-zinc-700">Icon</span>
      <input type="hidden" name={name} value={selected} />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
        {APP_MOBILE_ICON_KEYS.map(({ key, label }) => {
          const Icon = LUCIDE_BY_KEY[key] ?? CircleHelp;
          const isOn = selected === key;
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              title={`${label} (${key})`}
              onClick={() => setSelected(key)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                isOn
                  ? "border-(--portal-primary) bg-(--portal-primary)/10 ring-2 ring-(--portal-primary)/30"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
              } disabled:opacity-50`}
            >
              <Icon className="size-6 text-zinc-800" strokeWidth={1.75} aria-hidden />
              <span className="line-clamp-2 text-[10px] font-medium leading-tight text-zinc-600">{label}</span>
            </button>
          );
        })}
      </div>
      
    </div>
  );
}
