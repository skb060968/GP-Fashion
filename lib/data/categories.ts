// lib/data/categories.ts
// Category metadata and lookups over the generated catalogue
// (lib/data/shop.ts, lib/data/collections.ts). Pure and synchronous; anything
// that needs the database (bestsellers) lives in lib/services.

import { products, classifications, type Product, type ProductCategory, type Classification } from "./shop"
import { collections, type Collection } from "./collections"

export type { Product, Classification, Collection }
export type CategorySlug = ProductCategory

export const CATEGORY_SLUGS: CategorySlug[] = ["menswear", "womenswear"]

export const categoryMeta: Record<CategorySlug, { title: string; description: string; image: string }> = {
  menswear: {
    title: "Menswear",
    description:
      "Refined tailoring that balances tradition with contemporary style. Pieces for the modern man who values quality, fit, and timeless elegance.",
    image: "/images/home/menswear.webp",
  },
  womenswear: {
    title: "Womenswear",
    description:
      "Timeless silhouettes reimagined with a contemporary sensibility. Every piece tells a story of refined craftsmanship and understated luxury.",
    image: "/images/home/womenswear.webp",
  },
}

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as string[]).includes(value)
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const bySlug = new Map(products.map((p) => [p.slug, p]))

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug)
}

export function categoryOf(slug: string): CategorySlug | null {
  return bySlug.get(slug)?.category ?? null
}

/** Products in one category, in catalogue order (meta.json "order", then name). */
export function getCategoryProducts(category: CategorySlug): Product[] {
  return products.filter((p) => p.category === category)
}

/** Every product on the storefront. */
export function getAllProducts(): Product[] {
  return products
}

// ---------------------------------------------------------------------------
// Classifications
// ---------------------------------------------------------------------------

const classificationBySlug = new Map(classifications.map((c) => [c.slug, c]))

export function getClassification(slug: string): Classification | undefined {
  return classificationBySlug.get(slug)
}

/** Classifications that have at least one product in the category, in taxonomy order. */
export function getClassifications(category: CategorySlug): Classification[] {
  const present = new Set(products.filter((p) => p.category === category).map((p) => p.classification))
  return classifications.filter((c) => present.has(c.slug))
}

export function getClassificationProducts(category: CategorySlug, classification: string): Product[] {
  return products.filter((p) => p.category === category && p.classification === classification)
}

// ---------------------------------------------------------------------------
// New arrivals
// ---------------------------------------------------------------------------

/** Pieces released within this many days count as new. */
export const NEW_ARRIVALS_WINDOW_DAYS = 90

/**
 * Products in the category released in the last 90 days, newest first. If
 * nothing qualifies, falls back to the most recent release so the page is
 * never empty. `now` is injectable for tests.
 */
export function getNewArrivals(category: CategorySlug, now: Date = new Date()): Product[] {
  const pool = getCategoryProducts(category)
  if (pool.length === 0) return []

  const cutoff = new Date(now.getTime() - NEW_ARRIVALS_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  const byNewest = (a: Product, b: Product) => b.releaseDate.localeCompare(a.releaseDate) || a.order - b.order

  const recent = pool.filter((p) => p.releaseDate >= cutoff).sort(byNewest)
  if (recent.length > 0) return recent

  const latest = pool.reduce((max, p) => (p.releaseDate > max ? p.releaseDate : max), pool[0].releaseDate)
  return pool.filter((p) => p.releaseDate === latest).sort(byNewest)
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

const collectionBySlug = new Map(collections.map((c) => [c.slug, c]))

export function getCollection(slug: string): Collection | undefined {
  return collectionBySlug.get(slug)
}

/** All collections in display order (meta.json "order", then newest release). */
export function getCollections(): Collection[] {
  return collections
}

/** Products in a collection; menswear first, then womenswear, each in catalogue order. */
export function getCollectionProducts(slug: string): Product[] {
  return products.filter((p) => p.collection === slug)
}

// ---------------------------------------------------------------------------
// Category views (what the accordion under Menswear / Womenswear shows)
// ---------------------------------------------------------------------------

export type CategoryView = { slug: string; title: string; kind: "new-arrivals" | "classification" | "bestsellers" }

/** New Arrivals, then the classifications present in the category, then Bestsellers. */
export function getCategoryViews(category: CategorySlug): CategoryView[] {
  return [
    { slug: "new-arrivals", title: "New Arrivals", kind: "new-arrivals" },
    ...getClassifications(category).map((c) => ({ slug: c.slug, title: c.title, kind: "classification" as const })),
    { slug: "bestsellers", title: "Bestsellers", kind: "bestsellers" },
  ]
}
