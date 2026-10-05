import type { Metadata } from "next"
import CategoryListing from "@/components/CategoryListing"

export const metadata: Metadata = {
  title: "Menswear | Piyush Bholla",
  description:
    "Refined tailoring that balances tradition with contemporary style. Explore the menswear collection.",
}

export default function MenswearPage() {
  return <CategoryListing category="menswear" />
}
