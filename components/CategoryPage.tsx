import { notFound } from "next/navigation"
import type { Metadata } from "next"
import CategoryListing, { type ListingChip } from "@/components/CategoryListing"
import {
  categoryMeta,
  getCategoryProducts,
  getCategoryViews,
  getClassification,
  getClassificationProducts,
  getNewArrivals,
  type CategorySlug,
} from "@/lib/data/categories"
import { getBestsellers } from "@/lib/services/bestsellers"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"
const BRAND = "Piyush Bholla"

const VIEW_COPY: Record<"new-arrivals" | "bestsellers", (category: string) => string> = {
  "new-arrivals": (c) => `The latest ${c.toLowerCase()} pieces, newest release first.`,
  bestsellers: (c) => `The ${c.toLowerCase()} pieces our customers come back for.`,
}

export function categoryViewMetadata(category: CategorySlug, view?: string): Metadata {
  const meta = categoryMeta[category]
  const path = view ? `/${category}/${view}` : `/${category}`

  let title = meta.title
  let description = meta.description
  if (view === "new-arrivals" || view === "bestsellers") {
    title = `${view === "new-arrivals" ? "New Arrivals" : "Bestsellers"} · ${meta.title}`
    description = VIEW_COPY[view](meta.title)
  } else if (view) {
    const c = getClassification(view)
    if (!c) return {}
    title = `${c.title} · ${meta.title}`
    description = `${c.title} for ${meta.title.toLowerCase()} by ${BRAND}.`
  }

  const full = `${title} | ${BRAND}`
  return {
    title: full,
    description,
    openGraph: { title: full, description, url: `${SITE_URL}${path}`, images: [{ url: `${SITE_URL}${meta.image}` }] },
  }
}

export default async function CategoryPage({ category, view }: { category: CategorySlug; view?: string }) {
  const meta = categoryMeta[category]
  const views = getCategoryViews(category)
  const current = view ? views.find((v) => v.slug === view) : undefined
  if (view && !current) notFound()

  const chips: ListingChip[] = [
    { label: `All ${meta.title}`, href: `/${category}`, active: !view },
    ...views.map((v) => ({ label: v.title, href: `/${category}/${v.slug}`, active: v.slug === view })),
  ]

  if (!current) {
    return <CategoryListing title={meta.title} description={meta.description} banner={{ src: meta.image }} chips={chips} products={getCategoryProducts(category)} />
  }

  const eyebrow = { label: meta.title, href: `/${category}` }

  if (current.kind === "new-arrivals") {
    return <CategoryListing eyebrow={eyebrow} title="New Arrivals" description={VIEW_COPY["new-arrivals"](meta.title)} chips={chips} products={getNewArrivals(category)} />
  }

  if (current.kind === "bestsellers") {
    const { products, source } = await getBestsellers(category)
    return (
      <CategoryListing
        eyebrow={eyebrow}
        title="Bestsellers"
        description={VIEW_COPY.bestsellers(meta.title)}
        chips={chips}
        note={source === "sales" ? "Based on orders from the last 90 days." : undefined}
        products={products}
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
