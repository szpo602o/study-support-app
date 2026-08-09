import type { Metadata } from "next";
import { Klee_One, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

/** 見出し・判定・黒板数字向け（ノート／黒板の手書き感） */
const display = Klee_One({
  variable: "--font-display",
  weight: ["400", "600"],
  subsets: ["latin"],
  preload: false,
});

/** 本文・ナビ・入力向け（可読性優先） */
const body = Noto_Sans_JP({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "学習継続",
  description: "決めた目標に対して、毎日の学習を簡単に記録し継続を可視化する",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
