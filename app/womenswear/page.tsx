import type { Metadata } from "next"
import CategoryListing from "@/components/CategoryListing"

export const metadata: Metadata = {
  title: "Womenswear | Piyush Bholla",
  description:
    "Timeless silhouettes reimagined with a contemporary sensibility. Explore the womenswear collection.",
}

export default function WomenswearPage() {
  return <CategoryListing category="womenswear" />
}
