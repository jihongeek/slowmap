import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const griunPolFairness = localFont({
  src: "../../public/fonts/Griun_PolFairness-Rg.ttf",
  variable: "--font-griun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "급할수록 돌아가라",
  description: "모바일 길찾기 앱 - 급할수록 돌아가라",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${griunPolFairness.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
