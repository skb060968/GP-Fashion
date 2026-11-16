import type { Metadata } from "next"
import BagClient from "./BagClient"
import { getHiddenSlugs } from "@/lib/catalog/visibility"

export const metadata: Metadata = {
  title: "Shopping Bag | Piyush Bholla",
  description: "Review the pieces in your shopping bag.",
  robots: { index: false },
}

export default async function BagPage() {
  return <BagClient hiddenSlugs={await getHiddenSlugs()} />
}
