import type { Metadata } from "next"
import WishlistClient from "./WishlistClient"
import { getProductStatusLists } from "@/lib/catalog/visibility"

export const metadata: Metadata = {
  title: "Wishlist | Piyush Bholla",
  description: "Pieces you have saved for later.",
  robots: { index: false },
}

export default async function WishlistPage() {
  const { hidden, soldOut } = await getProductStatusLists()
  return <WishlistClient hiddenSlugs={hidden} soldOutSlugs={soldOut} />
}
