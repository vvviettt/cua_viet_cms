import type { Metadata } from "next";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { fontGeist, fontInter } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: SITE.title,
    template: `%s — ${SITE.shortTitle}`,
  },
  description: SITE.description,
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={cn("h-full antialiased", fontInter.variable, fontGeist.variable, "font-sans")}
    >
      <body className="flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
