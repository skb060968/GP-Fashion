import type { Metadata } from "next"
import BagClient from "./BagClient"

export const metadata: Metadata = {
  title: "Shopping Bag | Piyush Bholla",
  description: "Review the pieces in your shopping bag.",
  robots: { index: false },
}

export default function BagPage() {
  return <BagClient />
}
