import type { Metadata } from "next"
import WishlistClient from "./WishlistClient"
import { getHiddenSlugs } from "@/lib/catalog/visibility"

export const metadata: Metadata = {
  title: "Wishlist | Piyush Bholla",
  description: "Pieces you have saved for later.",
  robots: { index: false },
}

export default async function WishlistPage() {
  return <WishlistClient hiddenSlugs={await getHiddenSlugs()} />
}
