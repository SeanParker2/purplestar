import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "紫垣 THE ENCLOSURE - Pro",
  description: "紫微斗数排盘系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
