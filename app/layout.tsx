import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pixel2Motion Web - AI Logo Animation",
  description: "Turn raster logos into smooth SVG animations directly in your browser. Free, open-source, no server required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
