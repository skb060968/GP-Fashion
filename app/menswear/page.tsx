import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"

export function generateMetadata() {
  return categoryViewMetadata("menswear")
}

export default function MenswearPage() {
  return <CategoryPage category="menswear" />
}
