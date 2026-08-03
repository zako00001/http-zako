import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { getSiteContent } from "@/lib/site-content";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const [content, requestHeaders] = await Promise.all([getSiteContent(), headers()]);
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const baseUrl = new URL(`${protocol}://${host}`);
  const imageUrl = new URL("/og.png", baseUrl).toString();
  const description = `${content.tagline} 独立数字设计与视觉实验。`;
  return {
    title: `${content.brandName} — Digital Atelier`,
    description,
    metadataBase: baseUrl,
    openGraph: {
      title: `${content.brandName} — Digital Atelier`,
      description,
      type: "website",
      url: baseUrl,
      images: [{ url: imageUrl, alt: `${content.brandName} — Digital Atelier` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${content.brandName} — Digital Atelier`,
      description,
      images: [imageUrl],
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f7f2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
