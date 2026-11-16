import type { Metadata } from "next"
import BagClient from "./BagClient"
import { getProductStatusLists } from "@/lib/catalog/visibility"

export const metadata: Metadata = {
  title: "Shopping Bag | Piyush Bholla",
  description: "Review the pieces in your shopping bag.",
  robots: { index: false },
}

export default async function BagPage() {
  const { hidden, soldOut } = await getProductStatusLists()
  return <BagClient hiddenSlugs={hidden} soldOutSlugs={soldOut} />
}
