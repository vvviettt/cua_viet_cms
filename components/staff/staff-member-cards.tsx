import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import type { StaffMemberPublic } from "@/lib/staff-members/types";

function formatDob(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function avatarSrc(path: string): string {
  const segments = path.split("/").map((s) => encodeURIComponent(s));
  return `/uploads/${segments.join("/")}`;
}

type Props = {
  members: StaffMemberPublic[];
  /** Có đang lọc theo `q` trên URL không (khác với danh sách rỗng hoàn toàn). */
  isFiltered: boolean;
  /** Khi true, tên cán bộ là link tới trang chỉnh sửa. */
  canEdit?: boolean;
};

export function StaffMemberCards({ members, isFiltered, canEdit = false }: Props) {
  if (members.length === 0) {
    if (isFiltered) {
      return (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
          Không có cán bộ nào khớp bộ lọc. Thử từ khóa khác hoặc{" "}
          <a href="/can-bo" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
            xóa tìm kiếm
          </a>
          .
        </p>
      );
    }
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-600">
        Chưa có cán bộ trong hệ thống.
      </p>
    );
  }

  return (
    <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <li key={m.id}>
          <article className="flex h-full flex-col overflow-hidden rounded-xl border border-(--portal-border) bg-white shadow-sm">
            <div className="flex gap-4 p-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                {m.avatarRelativePath ? (
                  <Image
                    src={avatarSrc(m.avatarRelativePath)}
                    alt={`Ảnh đại diện ${m.fullName}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-zinc-400" aria-hidden>
                    <UserRound className="size-10" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-snug text-zinc-900">
                  {canEdit ? (
                    <Link
                      href={`/can-bo/${m.id}/chinh-sua`}
                      className="rounded outline-offset-2 hover:text-(--portal-primary) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--portal-primary)"
                    >
                      {m.fullName}
                    </Link>
                  ) : (
                    m.fullName
                  )}
                </h2>
                <p className="mt-1 text-sm font-medium text-(--portal-primary)">{m.jobTitle}</p>
                {!m.isActive ? (
                  <p className="mt-1 text-xs font-medium text-amber-800">Ngừng hiển thị</p>
                ) : null}
              </div>
            </div>
            <dl className="mt-auto grid gap-1 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-600">
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Ngày sinh</dt>
                <dd className="text-right text-zinc-800">{formatDob(m.dateOfBirth)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-zinc-500">Email</dt>
                <dd className="min-w-0 truncate text-right">
                  {m.contactEmail ? (
                    <a
                      href={`mailto:${m.contactEmail}`}
                      className="font-medium text-(--portal-primary) underline-offset-2 hover:underline"
                    >
                      {m.contactEmail}
                    </a>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </dd>
              </div>
            </dl>
          </article>
        </li>
      ))}
    </ul>
  );
}
