import type { Metadata, Viewport } from "next";
import {
  Barlow_Condensed,
  Be_Vietnam_Pro,
  JetBrains_Mono,
} from "next/font/google";
import { SITE_CONFIG } from "@/config/site.config";
import { StoreProvider } from "@/features/cart/context/store-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomDock } from "@/components/layout/mobile-bottom-dock";
import { MiniCartDrawer } from "@/features/cart/components/mini-cart-drawer";
import { QuickViewModal } from "@/features/catalog/components/quick-view-modal";
import { AutoraAgentHost } from "@/features/agent/autora-agent-host";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0056B3",
};

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  keywords: [
    "AUTORA",
    "dịch vụ ô tô Việt Nam",
    "đặt lịch bảo dưỡng ô tô",
    "phụ tùng và chăm sóc xe",
    "bảng giá bảo dưỡng ô tô",
    "phủ ceramic ô tô",
    "garage uy tín TP.HCM Hà Nội Đà Nẵng",
  ],
  openGraph: {
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    locale: SITE_CONFIG.locale,
    type: "website",
    siteName: SITE_CONFIG.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${barlowCondensed.variable} ${beVietnamPro.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-canvas text-ink"
      >
        <StoreProvider>
          <Navbar />
          <main className="flex-1 pb-20 lg:pb-0">{children}</main>
          <Footer />
          <MobileBottomDock />
          <MiniCartDrawer />
          <QuickViewModal />
          <AutoraAgentHost />
        </StoreProvider>
      </body>
    </html>
  );
}
