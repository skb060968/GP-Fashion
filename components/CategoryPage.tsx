import { notFound } from "next/navigation"
import type { Metadata } from "next"
import CategoryListing, { type ListingChip } from "@/components/CategoryListing"
import {
  ACTIVE_CATEGORY_SLUGS,
  categoryMeta,
  getCategoryImage,
  getCategoryProducts,
  getCategoryViews,
  getClassificationProducts,
  getNewArrivals,
  type CategorySlug,
} from "@/lib/data/categories"
import { getBestsellers } from "@/lib/services/bestsellers"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"
const BRAND = "Piyush Bholla"

const VIEW_COPY: Record<"new-arrivals" | "bestsellers", (category: string) => string> = {
  "new-arrivals": (category) => `The latest ${category.toLowerCase()} pieces, newest release first.`,
  bestsellers: (category) => `The ${category.toLowerCase()} pieces our customers come back for.`,
}

export function categoryViewMetadata(category: CategorySlug, view?: string): Metadata {
  if (!ACTIVE_CATEGORY_SLUGS.includes(category)) return { robots: { index: false, follow: false } }

  const meta = categoryMeta[category]
  const path = view ? `/${category}/${view}` : `/${category}`
  const views = getCategoryViews(category)
  const current = view ? views.find((candidate) => candidate.slug === view) : undefined
  if (view && !current) return {}

  let title = meta.title
  let description = meta.description
  if (current?.kind === "new-arrivals" || current?.kind === "bestsellers") {
    title = `${current.title} · ${meta.title}`
    description = VIEW_COPY[current.kind](meta.title)
  } else if (current?.kind === "classification") {
    title = `${current.title} · ${meta.title}`
    description = `${current.title} for ${meta.title.toLowerCase()} by ${BRAND}.`
  }

  const full = `${title} | ${BRAND}`
  const image = getCategoryImage(category)
  return {
    title: full,
    description,
    openGraph: { title: full, description, url: `${SITE_URL}${path}`, images: [{ url: `${SITE_URL}${image}` }] },
  }
}

export default async function CategoryPage({ category, view }: { category: CategorySlug; view?: string }) {
  const products = getCategoryProducts(category)
  if (products.length === 0) notFound()

  const meta = categoryMeta[category]
  const views = getCategoryViews(category)
  const current = view ? views.find((candidate) => candidate.slug === view) : undefined
  if (view && !current) notFound()

  const chips: ListingChip[] = [
    { label: `All ${meta.title}`, href: `/${category}`, active: !view },
    ...views.map((candidate) => ({ label: candidate.title, href: `/${category}/${candidate.slug}`, active: candidate.slug === view })),
  ]

  if (!current) {
    return <CategoryListing title={meta.title} description={meta.description} banner={{ src: getCategoryImage(category) }} chips={chips} products={products} />
  }

  const eyebrow = { label: meta.title, href: `/${category}` }

  if (current.kind === "new-arrivals") {
    return <CategoryListing eyebrow={eyebrow} title="New Arrivals" description={VIEW_COPY["new-arrivals"](meta.title)} chips={chips} products={getNewArrivals(category)} />
  }

  if (current.kind === "bestsellers") {
    const result = await getBestsellers(category)
    return (
      <CategoryListing
        eyebrow={eyebrow}
        title="Bestsellers"
        description={VIEW_COPY.bestsellers(meta.title)}
        chips={chips}
        note={result.source === "sales" ? "Based on orders from the last 90 days." : undefined}
        products={result.products}
        emptyMessage="Bestsellers appear here once the first orders come in."
      />
    )
  }

  return (
    <CategoryListing
      eyebrow={eyebrow}
      title={current.title}
      description={`${current.title} for ${meta.title.toLowerCase()}.`}
      chips={chips}
      products={getClassificationProducts(category, current.slug)}
    />
  )
}
