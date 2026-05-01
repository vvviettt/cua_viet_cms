import { headers } from "next/headers";

export const dynamic = "force-dynamic";
import {
  requireModuleEditAccess,
  requireModuleViewAccess,
} from "@/lib/cms-module-access";

function normalizePath(p: string): string {
  if (!p.startsWith("/")) return `/${p}`;
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

export default async function CauHinhAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = await headers();
  const raw = h.get("x-pathname");
  if (!raw) {
    await requireModuleViewAccess("app_mobile");
    return <>{children}</>;
  }

  const pathname = normalizePath(raw);
  const isAppRoot = pathname === "/cau-hinh-app";

  if (isAppRoot) {
    await requireModuleViewAccess("app_mobile");
  } else {
    await requireModuleEditAccess("app_mobile");
  }

  return <>{children}</>;
}
