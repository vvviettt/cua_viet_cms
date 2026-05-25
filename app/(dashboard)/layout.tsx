import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

/** CMS dùng cookie/session — không prerender tĩnh (tránh lỗi hook client khi build). */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 flex-col bg-white">{children}</main>
      <SiteFooter />
    </>
  );
}
