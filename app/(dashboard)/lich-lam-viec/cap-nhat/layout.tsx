import { requireModuleEditAccess } from "@/lib/cms-module-access";

export default async function LichLamViecCapNhatLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleEditAccess("work_schedule");
  return <>{children}</>;
}
