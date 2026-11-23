import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionRuntime } from "@/components/MotionRuntime";
import { SunMotion } from "@/components/SunMotion";
import { CookieConsent } from "@/components/CookieConsent";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.casapenareia.com"),
  title: { default: "Casa Pé n’Areia | Chalés e casa de praia em Caetanos", template: "%s | Casa Pé n’Areia" },
  description: "Hospedagem em Caetanos, Amontada: chalés e casa de praia pertinho do mar, com conforto, tranquilidade e atendimento direto.",
  openGraph: {
    type: "website", locale: "pt_BR", url: "https://www.casapenareia.com",
    siteName: "Casa Pé n’Areia", title: "Casa Pé n’Areia | Caetanos, Ceará",
    description: "Chalés e casa de praia a poucos passos do mar."
  },
  twitter: { card: "summary_large_image", title: "Casa Pé n’Areia | Caetanos, Ceará", description: "Chalés e casa de praia a poucos passos do mar." },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className={sans.variable}><body><MotionRuntime /><SunMotion /><Header /><main className="site-main">{children}</main><Footer /><WhatsAppFloat /><CookieConsent /></body></html>;
}
