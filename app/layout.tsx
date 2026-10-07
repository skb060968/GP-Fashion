import localFont from "next/font/local"
import "./globals.css"
import ClientGuards from "@/components/ClientGuards"
import LayoutShell from "@/components/LayoutShell"
import { CartProvider } from "@/context/CartContext"
import { WishlistProvider } from "@/context/WishlistContext"
import { UserProvider } from "@/context/UserContext"

const cinzel = localFont({
  src: "./fonts/Cinzel-Variable.woff2",
  weight: "400 900",
  display: "swap",
  variable: "--font-cinzel",
})

const jost = localFont({
  src: "./fonts/Jost-Variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-jost",
})

export const metadata = {
  title: "Piyush Bholla",
  description: "Fashion & Design",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${cinzel.variable} ${jost.variable}`}>
      <body className="flex min-h-screen flex-col">
        <UserProvider>
          <CartProvider>
            <WishlistProvider>
              <ClientGuards />
              <LayoutShell>{children}</LayoutShell>
            </WishlistProvider>
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  )
}
