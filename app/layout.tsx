import { Cinzel, Jost } from "next/font/google"
import "./globals.css"
import ClientGuards from "@/components/ClientGuards"
import LayoutShell from "@/components/LayoutShell"
import { CartProvider } from "@/context/CartContext"

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cinzel",
})

// Geometric sans for navigation / UI labels, paired with Cinzel for the wordmark.
const jost = Jost({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
        <CartProvider>
          <ClientGuards />
          <LayoutShell>{children}</LayoutShell>
        </CartProvider>
      </body>
    </html>
  )
}