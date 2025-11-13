import type { Metadata } from "next";
import { Raleway } from "next/font/google";
// @ts-ignore
import "@/assets/styles/globals.css";
import Header from "@/components/Header";
import { TelegramProvider } from "@/providers/TelegramProvider";
import Script from "next/script";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
  title: "StarShop - Интернет-магазин онлайн товаров",
  description: "Донаты в игры и покупка подписок в сервисы для Приднестровья",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className={`${raleway.variable} antialiased`} suppressHydrationWarning>
        <TelegramProvider>
          <Header />
          <main className="pb-4">{children}</main>
        </TelegramProvider>
      </body>
    </html>
  );
}
