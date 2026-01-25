import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { BottomNavigation } from "@/components/bottom-navigation"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Studio Regiane Rodrigues",
  description: "Agende suas sessões de massagem e terapias no Studio Regiane Rodrigues",
  generator: "v0.app",
  applicationName: "Studio Regiane Rodrigues",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Studio R.R.",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6FB57F",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.className} font-sans antialiased`}>
        {children}
        <BottomNavigation />
        <Analytics />
      </body>
    </html>
  )
}
