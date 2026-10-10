import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"

export const metadata = categoryViewMetadata("kidswear")

export default function KidswearPage() {
  return <CategoryPage category="kidswear" />
}
