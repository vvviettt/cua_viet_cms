"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CreateCmsUserWizard } from "@/components/phan-quyen/create-cms-user-wizard";
import { CmsUserProfileForm } from "@/components/phan-quyen/cms-user-profile-form";
import { CmsUserPhanQuyenContent } from "@/components/phan-quyen/cms-user-phan-quyen-content";
import { CmsUsersTable } from "@/components/phan-quyen/cms-users-table";
import type { AdminUserListItem } from "@/lib/db/users";

type Props = {
  users: AdminUserListItem[];
  permissionsByUserId: Record<string, string>;
  currentUserId: string;
};

export function PhanQuyenShell(props: Props) {
  const { users, permissionsByUserId, currentUserId } = props;
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [permUserId, setPermUserId] = useState<string | null>(null);

  const detailUser = detailUserId ? (users.find((u) => u.id === detailUserId) ?? null) : null;
  const permUser = permUserId ? (users.find((u) => u.id === permUserId) ?? null) : null;

  useEffect(() => {
    if (detailUserId && !users.some((u) => u.id === detailUserId)) {
      setDetailUserId(null);
    }
    if (permUserId && !users.some((u) => u.id === permUserId)) {
      setPermUserId(null);
    }
  }, [users, detailUserId, permUserId]);

  const closeCreate = useCallback(() => setCreateOpen(false), []);
  const closeDetail = useCallback(() => setDetailUserId(null), []);
  const closePerm = useCallback(() => setPermUserId(null), []);

  const afterMutation = useCallback(() => {
    router.refresh();
  }, [router]);

  const finishCreateDialog = useCallback(() => {
    closeCreate();
    afterMutation();
  }, [closeCreate, afterMutation]);

  const permPermissionsJson =
    permUser && !permUser.isAdmin ? permissionsByUserId[permUser.id] ?? "[]" : "[]";

  const detailTitle =
    detailUser != null ? `Chi tiết — ${detailUser.fullName?.trim() || detailUser.email}` : "Chi tiết";

  const permTitle =
    permUser != null ? `Phân quyền — ${permUser.fullName?.trim() || permUser.email}` : "Phân quyền";

  return (
    <>
      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Người dùng CMS &amp; phân quyền
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            Chi tiết: chỉ chỉnh thông tin đăng nhập. Phân quyền: chọn quản trị viên hoặc người dùng CMS và gán module.
            Các thao tác gom trong một cột trên mỗi dòng.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-(--portal-primary) px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-95"
        >
          Tạo tài khoản
        </button>
      </header>

      <div className="mt-8">
        <CmsUsersTable
          users={users}
          currentUserId={currentUserId}
          onOpenChiTiet={(u) => setDetailUserId(u.id)}
          onOpenPhanQuyen={(u) => setPermUserId(u.id)}
        />
      </div>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Tạo tài khoản CMS"
        maxWidthClassName="max-w-lg"
        bodyClassName="max-h-[min(85vh,800px)] overflow-y-auto px-5 py-5"
      >
        {createOpen ? <CreateCmsUserWizard onComplete={finishCreateDialog} /> : null}
      </Modal>

      <Modal
        open={detailUser != null}
        onClose={closeDetail}
        title={detailTitle}
        maxWidthClassName="max-w-lg"
        bodyClassName="max-h-[min(85vh,920px)] overflow-y-auto px-5 py-4 sm:px-6"
      >
        {detailUser ? <CmsUserProfileForm key={`${detailUser.id}-${detailUser.updatedAt}`} user={detailUser} /> : null}
      </Modal>

      <Modal
        open={permUser != null}
        onClose={closePerm}
        title={permTitle}
        maxWidthClassName="max-w-3xl"
        bodyClassName="max-h-[min(85vh,920px)] overflow-y-auto px-5 py-5"
      >
        {permUser ? (
          <CmsUserPhanQuyenContent
            key={`${permUser.id}-${permUser.isAdmin}-${permUser.updatedAt}`}
            user={permUser}
            permissionsJson={permPermissionsJson}
          />
        ) : null}
      </Modal>
    </>
  );
}
