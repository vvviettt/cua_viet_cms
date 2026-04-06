import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

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
    <html lang="vi" className={cn("h-full antialiased", inter.variable, "font-sans", geist.variable)}>
      <body className="flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
