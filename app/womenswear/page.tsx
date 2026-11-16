import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"

export function generateMetadata() {
  return categoryViewMetadata("womenswear")
}

export default function WomenswearPage() {
  return <CategoryPage category="womenswear" />
}
