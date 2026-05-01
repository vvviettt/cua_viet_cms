import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { canManageUsers } from "@/lib/roles";

export default async function PhanQuyenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session || !canManageUsers(session.isAdmin)) {
    redirect("/");
  }
  return <>{children}</>;
}
