import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사원명부 조회 시스템",
  description: "SOOSAN 사원명부 조회 시스템",
  icons: {
    icon: "/soosan-logo.png",
    apple: "/soosan-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
