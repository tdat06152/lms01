import type { Metadata } from "next";
import "./globals.css";
import { ThemeInitScript } from "@/app/_components/ThemeInitScript";
import { AppShell } from "@/app/_components/AppShell";

export const metadata: Metadata = {
  title: "LMS TOEIC",
  description: "LMS luyện TOEIC (Grammar) với Supabase"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeInitScript />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
