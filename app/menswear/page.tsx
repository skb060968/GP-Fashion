import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"

export const metadata = categoryViewMetadata("menswear")

export default function MenswearPage() {
  return <CategoryPage category="menswear" />
}
