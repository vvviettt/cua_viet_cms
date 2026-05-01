import { requireModuleViewAccess } from "@/lib/cms-module-access";

export default async function DuongDayNongLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleViewAccess("hotline");
  return <>{children}</>;
}
