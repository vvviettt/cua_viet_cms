import { requireModuleViewAccess } from "@/lib/cms-module-access";

export default async function PhanAnhKienNghiLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleViewAccess("citizen_feedback");
  return <>{children}</>;
}
