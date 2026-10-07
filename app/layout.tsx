import "@fontsource-variable/cinzel"
import "@fontsource-variable/jost"
import "./globals.css"
import ClientGuards from "@/components/ClientGuards"
import LayoutShell from "@/components/LayoutShell"
import { CartProvider } from "@/context/CartContext"
import { WishlistProvider } from "@/context/WishlistContext"
import { UserProvider } from "@/context/UserContext"

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
