import { requireModuleViewAccess } from "@/lib/cms-module-access";

export default async function TinTucLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleViewAccess("news");
  return <>{children}</>;
}
