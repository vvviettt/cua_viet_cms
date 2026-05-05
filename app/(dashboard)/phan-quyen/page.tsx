import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { listAdminUsers } from "@/lib/db/users";
import { listPermissionsByUserId } from "@/lib/db/user-module-permissions";
import { PhanQuyenShell } from "@/components/phan-quyen/phan-quyen-shell";

export const metadata: Metadata = {
    title: "Người dùng CMS & phân quyền",
    description: "Quản lý tài khoản CMS và phân quyền module — " + SITE.shortTitle,
};

export default async function PhanQuyenPage() {
    const session = await getSession();
    if (!session) {
        redirect("/dang-nhap");
    }

    const allUsers = await listAdminUsers();
    const users = allUsers.filter((u) => u.id !== session.userId);

    const permissionsByUserId: Record<string, string> = {};
    for (const u of users) {
        if (!u.isAdmin) {
            permissionsByUserId[u.id] = JSON.stringify(await listPermissionsByUserId(u.id));
        }
    }

    return (
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
            <Link
                href="/"
                className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
            >
                ← Bảng điều khiển
            </Link>

            <PhanQuyenShell
                users={users}
                permissionsByUserId={permissionsByUserId}
                currentUserId={session.userId}
            />
        </div>
    );
}
