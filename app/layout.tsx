import "@fontsource-variable/cinzel"
import "@fontsource-variable/jost"
import "./globals.css"
import ClientGuards from "@/components/ClientGuards"
import LayoutShell from "@/components/LayoutShell"
import { CartProvider } from "@/context/CartContext"
import { WishlistProvider } from "@/context/WishlistContext"
import { UserProvider } from "@/context/UserContext"
import SiteAnalytics from "@/components/SiteAnalytics"
import type { Metadata } from "next"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Piyush Bholla", template: "%s" },
  description:
    "Designer menswear and womenswear by Piyush Bholla, made in New Delhi. Ready to wear in standard sizes or made to measure at the same price.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col">
        <UserProvider>
          <CartProvider>
            <WishlistProvider>
              <ClientGuards />
              <LayoutShell>{children}</LayoutShell>
            </WishlistProvider>
          </CartProvider>
        </UserProvider>
        <SiteAnalytics />
      </body>
    </html>
  )
}
