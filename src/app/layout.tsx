import type { Metadata, Viewport } from "next";
import { Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import { APP_NAME } from "@/lib/config";
import SWRegister from "@/components/sw-register";
import "./globals.css";

const noto = Noto_Sans_KR({ variable: "--font-noto", weight: ["400", "500", "700"], preload: false });
const gowun = Gowun_Batang({ variable: "--font-gowun", weight: ["400", "700"], preload: false });

export const metadata: Metadata = {
  title: APP_NAME,
  description: "만날 때마다 남기는 우리의 기록",
  applicationName: APP_NAME,
  appleWebApp: { capable: true, title: APP_NAME, statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f2ec",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${noto.variable} ${gowun.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
