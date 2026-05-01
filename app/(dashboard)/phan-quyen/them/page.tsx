import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/constants";
import { getUserIsAdminById } from "@/lib/db/users";
import { listPermissionsByUserId } from "@/lib/db/user-module-permissions";
import { CreateCmsUserWizard } from "@/components/phan-quyen/create-cms-user-wizard";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function pickParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  const t = String(v).trim();
  return t || undefined;
}

export const metadata: Metadata = {
  title: "Tài khoản mới",
  description: "Tạo tài khoản CMS — " + SITE.shortTitle,
};

type PageProps = {
  searchParams: Promise<{ buoc?: string | string[]; userId?: string | string[] }>;
};

export default async function PhanQuyenThemPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const buoc = pickParam(sp.buoc);
  const uid = pickParam(sp.userId);
  const isStep2 = buoc === "2" && uid != null && UUID_RE.test(uid);

  let resumeUserId: string | undefined;
  let resumePermissionsJson: string | undefined;
  let adminResumeBlock = false;
  let invalidResumeUser = false;

  if (isStep2 && uid) {
    const isAdminUser = await getUserIsAdminById(uid);
    if (isAdminUser === null) {
      invalidResumeUser = true;
    } else if (isAdminUser === true) {
      adminResumeBlock = true;
    } else {
      resumeUserId = uid;
      resumePermissionsJson = JSON.stringify(await listPermissionsByUserId(uid));
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
      <Link
        href="/phan-quyen"
        className="text-sm font-medium text-(--portal-primary) underline-offset-2 hover:underline"
      >
        ← Phân quyền
      </Link>

      <header className="mt-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Tài khoản mới</h1>
        <p className="mt-2 text-sm text-zinc-600">Hai bước: thông tin đăng nhập, rồi quyền module.</p>
      </header>

      <div className="mt-8">
        {invalidResumeUser ? (
          <p className="text-sm text-zinc-600">
            Tài khoản không tồn tại.{" "}
            <Link href="/phan-quyen/them" className="font-medium text-(--portal-primary) underline-offset-2 hover:underline">
              Tạo mới
            </Link>
          </p>
        ) : (
          <CreateCmsUserWizard
            key={resumeUserId ? `p-${resumeUserId}` : adminResumeBlock ? "admin" : "new"}
            resumeStep2UserId={resumeUserId}
            resumePermissionsJson={resumePermissionsJson}
            adminResumeBlock={adminResumeBlock}
          />
        )}
      </div>
    </div>
  );
}
