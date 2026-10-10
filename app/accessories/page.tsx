import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"

export const metadata = categoryViewMetadata("accessories")

export default function AccessoriesPage() {
  return <CategoryPage category="accessories" />
}
