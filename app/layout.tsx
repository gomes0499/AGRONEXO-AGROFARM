import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthHandler } from "./auth-handler";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AGROFARM - Gestão Agrícola e Financeira",
  description:
    "Plataforma de consultoria para produtores rurais, gestão de propriedades agrícolas e análise financeira",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.svg",
  },
  keywords: [
    "agricultura",
    "consultoria",
    "gestão rural",
    "financeiro",
    "pecuária",
    "produção agrícola",
  ],
  authors: [
    {
      name: "SR Consultoria",
      url: "https://sr-consultoria.com",
    },
  ],
};

// Separate viewport export as recommended by Next.js
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#17134F",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          disableTransitionOnChange
          enableColorScheme
        >
          <AuthHandler />
          <main className="min-h-screen flex flex-col bg-card">
            {children}
            <Toaster />
          </main>

          {/* Adicionar bibliotecas de mapas */}
          <Script
            src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            strategy="lazyOnload"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
