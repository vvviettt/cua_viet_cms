import { requireModuleViewAccess } from "@/lib/cms-module-access";

export default async function CanBoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleViewAccess("staff");
  return <>{children}</>;
}
