import { requireModuleViewAccess } from "@/lib/cms-module-access";

export default async function LichLamViecLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleViewAccess("work_schedule");
  return <>{children}</>;
}
