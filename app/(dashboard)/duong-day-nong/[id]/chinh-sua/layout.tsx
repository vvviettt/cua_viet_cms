import { requireModuleEditAccess } from "@/lib/cms-module-access";

export default async function DuongDayNongChinhSuaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleEditAccess("hotline");
  return <>{children}</>;
}
