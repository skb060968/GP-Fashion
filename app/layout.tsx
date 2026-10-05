import localFont from "next/font/local"
import "./globals.css"
import ClientGuards from "@/components/ClientGuards"
import LayoutShell from "@/components/LayoutShell"
import { CartProvider } from "@/context/CartContext"

// Fonts are self-hosted (app/fonts) so the build never depends on fetching
// from Google Fonts. Both are variable fonts covering the latin subset.
const cinzel = localFont({
  src: "./fonts/Cinzel-Variable.woff2",
  weight: "400 900",
  display: "swap",
  variable: "--font-cinzel",
})

// Geometric sans for navigation / UI labels, paired with Cinzel for the wordmark.
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
        <CartProvider>
          <ClientGuards />
          <LayoutShell>{children}</LayoutShell>
        </CartProvider>
      </body>
    </html>
  )
}