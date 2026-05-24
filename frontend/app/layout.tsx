import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 情绪护盾",
  description: "双向情绪防火墙黑客松 MVP",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
