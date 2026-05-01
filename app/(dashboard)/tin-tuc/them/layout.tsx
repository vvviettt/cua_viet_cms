import { requireModuleEditAccess } from "@/lib/cms-module-access";

export default async function TinTucThemLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleEditAccess("news");
  return <>{children}</>;
}
