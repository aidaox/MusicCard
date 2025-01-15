import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { inter } from "./fonts";

export const metadata: Metadata = {
  title: "Card.Catpng.net - 音乐卡片生成器",
  description: "为你喜欢的音乐生成精美卡片",
  icons: {
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=optional"
          rel="stylesheet"
        />
        {/* Google Analytics 代码 */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-95V6TTBE9N`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-95V6TTBE9N', {
                linker: {
                  domains: ['catpng.net', 'download.catpng.net', 'card.catpng.net', 'convert.catpng.net']
                },
                allow_linker: true
              });
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
