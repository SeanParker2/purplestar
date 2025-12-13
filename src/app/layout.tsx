import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

// TODO: Replace with your actual domain when deployed
const SITE_URL = "https://ziyuan.app";

export const metadata: Metadata = {
  title: "PurpleStar - Professional Zi Wei Dou Shu Astrolabe",
  description: "PurpleStar is a professional Zi Wei Dou Shu astrolabe tool based on true solar time. Integrating traditional I-Ching wisdom with modern AI technology, it provides precise chart calculations, yearly fortune analysis, and personalized guidance.",
  keywords: ["PurpleStar", "Zi Wei Dou Shu", "Astrolabe", "Fortune Telling", "AI", "True Solar Time", "Chinese Astrology"],
  manifest: "/manifest.json",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "PurpleStar - Professional Zi Wei Dou Shu Astrolabe",
    description: "PurpleStar is a professional Zi Wei Dou Shu astrolabe tool based on true solar time. Integrating traditional I-Ching wisdom with modern AI technology.",
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "PurpleStar",
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`, // TODO: Please add og-image.jpg to your public folder
        width: 1200,
        height: 630,
        alt: "PurpleStar - Professional Zi Wei Dou Shu Astrolabe",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PurpleStar - Professional Zi Wei Dou Shu Astrolabe",
    description: "PurpleStar is a professional Zi Wei Dou Shu astrolabe tool based on true solar time. Integrating traditional I-Ching wisdom with modern AI technology.",
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
    "name": "PurpleStar",
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
