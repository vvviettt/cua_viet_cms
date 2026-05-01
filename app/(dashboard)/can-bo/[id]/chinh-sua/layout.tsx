import { requireModuleEditAccess } from "@/lib/cms-module-access";

export default async function CanBoChinhSuaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleEditAccess("staff");
  return <>{children}</>;
}
