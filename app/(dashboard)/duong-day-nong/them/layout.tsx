import { requireModuleEditAccess } from "@/lib/cms-module-access";

export default async function DuongDayNongThemLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleEditAccess("hotline");
  return <>{children}</>;
}
