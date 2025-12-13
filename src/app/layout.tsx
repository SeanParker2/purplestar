import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "紫垣 - 专业紫微斗数排盘",
  description: "融合传统与现代的紫微斗数排盘系统，提供精准的命盘分析与运势解读。",
  manifest: "/manifest.json",
  openGraph: {
    title: "紫垣 - 专业紫微斗数排盘",
    description: "融合传统与现代的紫微斗数排盘系统，提供精准的命盘分析与运势解读。",
    type: "website",
    locale: "zh_CN",
    siteName: "紫垣 The Enclosure",
  },
  twitter: {
    card: "summary_large_image",
    title: "紫垣 - 专业紫微斗数排盘",
    description: "融合传统与现代的紫微斗数排盘系统，提供精准的命盘分析与运势解读。",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
