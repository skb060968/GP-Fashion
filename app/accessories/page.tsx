import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"

export function generateMetadata() {
  return categoryViewMetadata("accessories")
}

export default function AccessoriesPage() {
  return <CategoryPage category="accessories" />
}
