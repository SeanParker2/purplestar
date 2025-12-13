import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

// TODO: Replace with your actual domain when deployed
const SITE_URL = "https://ziyuan.app";

export const metadata: Metadata = {
  title: "紫垣 (The Enclosure) - 专业紫微斗数排盘与智能解盘系统",
  description: "基于真太阳时的专业紫微斗数排盘工具。融合传统易学与现代 AI 技术，提供精准的命盘推演、流年运势分析及个性化运程指导。弘扬东方星象美学。",
  keywords: ["紫微斗数", "在线排盘", "算命", "运势", "流年", "AI解盘", "真太阳时", "传统文化"],
  manifest: "/manifest.json",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "紫垣 (The Enclosure) - 专业紫微斗数排盘与智能解盘系统",
    description: "基于真太阳时的专业紫微斗数排盘工具。融合传统易学与现代 AI 技术，提供精准的命盘推演、流年运势分析及个性化运程指导。",
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "紫垣 The Enclosure",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`, // TODO: Please add og-image.jpg to your public folder
        width: 1200,
        height: 630,
        alt: "紫垣 - 专业紫微斗数排盘",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "紫垣 (The Enclosure) - 专业紫微斗数排盘与智能解盘系统",
    description: "基于真太阳时的专业紫微斗数排盘工具。融合传统易学与现代 AI 技术，提供精准的命盘推演、流年运势分析及个性化运程指导。",
    images: [`${SITE_URL}/og-image.jpg`],
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
  // JSON-LD Structured Data for SoftwareApplication
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "紫垣 (The Enclosure)",
    "applicationCategory": "LifestyleApplication",
    "operatingSystem": "Browser",
    "description": "基于真太阳时的专业紫微斗数排盘工具，融合传统易学与现代 AI 技术。",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CNY"
    }
  };

  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
