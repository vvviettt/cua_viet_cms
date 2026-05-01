import { cache } from "react";
import { redirect } from "next/navigation";
import type { SessionPayload } from "@/lib/auth";
import { getSession } from "@/lib/auth";
import type { CmsModuleKey } from "@/lib/cms-modules";
import { listPermissionsByUserId } from "@/lib/db/user-module-permissions";

const rowsForUser = cache(async (userId: string) => {
  return listPermissionsByUserId(userId);
});

export async function canViewCmsModule(session: SessionPayload, module: CmsModuleKey): Promise<boolean> {
  if (session.isAdmin) return true;
  const rows = await rowsForUser(session.userId);
  const row = rows.find((r) => r.moduleKey === module);
  return Boolean(row?.canRead || row?.canEdit);
}

export async function canEditCmsModule(session: SessionPayload, module: CmsModuleKey): Promise<boolean> {
  if (session.isAdmin) return true;
  const rows = await rowsForUser(session.userId);
  const row = rows.find((r) => r.moduleKey === module);
  return Boolean(row?.canEdit);
}

export async function sessionCanEditModule(
  session: SessionPayload,
  module: CmsModuleKey,
): Promise<boolean> {
  return canEditCmsModule(session, module);
}

export async function requireModuleViewAccess(module: CmsModuleKey): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/dang-nhap");
  if (!(await canViewCmsModule(session, module))) redirect("/");
  return session;
}

export async function requireModuleEditAccess(module: CmsModuleKey): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/dang-nhap");
  if (!(await canEditCmsModule(session, module))) redirect("/");
  return session;
}
