import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"

export const metadata = categoryViewMetadata("womenswear")

export default function WomenswearPage() {
  return <CategoryPage category="womenswear" />
}
