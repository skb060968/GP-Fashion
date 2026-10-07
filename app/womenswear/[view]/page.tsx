import type { Metadata } from "next"
import CategoryPage, { categoryViewMetadata } from "@/components/CategoryPage"
import { getCategoryViews } from "@/lib/data/categories"

const CATEGORY = "womenswear"

export const revalidate = 3600

type Props = { params: Promise<{ view: string }> }

export function generateStaticParams() {
  return getCategoryViews(CATEGORY).map((v) => ({ view: v.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { view } = await params
  return categoryViewMetadata(CATEGORY, view)
}

export default async function WomenswearViewPage({ params }: Props) {
  const { view } = await params
  return <CategoryPage category={CATEGORY} view={view} />
}
