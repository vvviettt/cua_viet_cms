import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { listAdminUsers } from "@/lib/db/users";
import { listPermissionsByUserId } from "@/lib/db/user-module-permissions";
import { UserModulePermissionsForm } from "@/components/phan-quyen/user-module-permissions-form";
import { cn } from "@/lib/utils";

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickParam(
    value: string | string[] | undefined,
): string | undefined {
    if (value === undefined) return undefined;
    const v = Array.isArray(value) ? value[0] : value;
    const t = String(v).trim();
    return t || undefined;
}

export const metadata: Metadata = {
    title: "Phân quyền",
    description: "Gán quyền module theo người dùng — " + SITE.shortTitle,
};

type PageProps = {
    searchParams: Promise<{ userId?: string | string[] }>;
};

export default async function PhanQuyenPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const userIdParam = pickParam(sp.userId);
    const users = await listAdminUsers();

    const selected =
        userIdParam && UUID_RE.test(userIdParam)
            ? users.find((u) => u.id === userIdParam)
            : undefined;

    const permissionsJson =
        selected && !selected.isAdmin
            ? JSON.stringify(await listPermissionsByUserId(selected.id))
            : "[]";

    return (
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
            <Link
                href="/"
                className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
            >
                ← Bảng điều khiển
            </Link>

            <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Phân quyền</h1>
                    <p className="mt-2 text-sm text-zinc-600">
                        Mỗi module chỉ chọn một mức: không truy cập, quyền đọc, hoặc quyền chỉnh sửa. Quản trị viên luôn có toàn quyền.
                    </p>
                </div>
                <Link
                    href="/phan-quyen/them"
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-95"
                >
                    Tạo mới
                </Link>
            </header>

            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
                <section className="rounded-xl border border-zinc-200 bg-white">
                    <div className="border-b border-zinc-200 px-4 py-3">
                        <h2 className="text-sm font-semibold text-zinc-900">Tài khoản CMS</h2>
                    </div>
                    <ul className="max-h-[min(70vh,520px)] divide-y divide-zinc-200 overflow-y-auto">
                        {users.length === 0 ? (
                            <li className="px-4 py-6 text-sm text-zinc-600">Chưa có tài khoản.</li>
                        ) : (
                            users.map((u) => {
                                const active = selected?.id === u.id;
                                return (
                                    <li key={u.id}>
                                        <Link
                                            href={`/phan-quyen?userId=${encodeURIComponent(u.id)}`}
                                            className={cn(
                                                "block cursor-pointer px-4 py-3 text-left transition-all duration-200 active:scale-[0.99]",
                                                active
                                                    ? "bg-zinc-100 ring-2 ring-inset ring-(--portal-primary)"
                                                    : "hover:bg-zinc-50",
                                            )}
                                        >
                                            <span className="block truncate font-medium text-zinc-900">
                                                {u.fullName?.trim() || u.email}
                                            </span>
                                            <span className="mt-0.5 block truncate text-xs text-zinc-500">{u.email}</span>
                                            <span className="mt-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200">
                                                {u.isAdmin ? "Quản trị" : "CMS"}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </section>

                <section className="min-w-0">
                    {!selected ? (
                        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center text-sm text-zinc-600">
                            Chọn một tài khoản
                        </div>
                    ) : selected.isAdmin ? (
                        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-8 text-sm text-zinc-600">
                            Quản trị viên có toàn quyền mọi module — không gán quyền riêng.
                        </div>
                    ) : (
                        <div className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-6">
                            <div className="mb-6 border-b border-zinc-200 pb-4">
                                <h2 className="text-base font-semibold text-zinc-900">
                                    {selected.fullName?.trim() || selected.email}
                                </h2>
                                <p className="mt-1 text-sm text-zinc-500">{selected.email}</p>
                            </div>
                            <UserModulePermissionsForm
                                key={`${selected.id}-${permissionsJson}`}
                                userId={selected.id}
                                permissionsJson={permissionsJson}
                            />
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
