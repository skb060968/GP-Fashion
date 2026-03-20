import "./globals.css"
import ClientGuards from "@/components/ClientGuards"
import LayoutShell from "@/components/LayoutShell"
import { CartProvider } from "@/context/CartContext"

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
    <html lang="en" data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <ClientGuards />
          <LayoutShell>{children}</LayoutShell>
        </CartProvider>
      </body>
    </html>
  )
}