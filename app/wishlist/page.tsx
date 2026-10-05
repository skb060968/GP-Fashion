import type { Metadata } from "next"
import WishlistClient from "./WishlistClient"

export const metadata: Metadata = {
  title: "Wishlist | Piyush Bholla",
  description: "Pieces you have saved for later.",
  robots: { index: false },
}

export default function WishlistPage() {
  return <WishlistClient />
}
