import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"

export function generateMetadata() {
  return categoryViewMetadata("kidswear")
}

export default function KidswearPage() {
  return <CategoryPage category="kidswear" />
}
