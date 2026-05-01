import { requireModuleEditAccess } from "@/lib/cms-module-access";

export default async function TinTucChinhSuaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireModuleEditAccess("news");
  return <>{children}</>;
}
