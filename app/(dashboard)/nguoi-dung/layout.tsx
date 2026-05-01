import { requireModuleViewAccess } from "@/lib/cms-module-access";

export default async function NguoiDungLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleViewAccess("user_management");
  return <>{children}</>;
}
