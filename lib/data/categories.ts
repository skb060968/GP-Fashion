import {
  products,
  classifications,
  productCategories,
  sizeOptionsByCategory,
  type Product,
  type ProductCategory,
  type Classification,
} from "./shop"
import { collections, type Collection } from "./collections"

export type { Product, Classification, Collection }
export type CategorySlug = ProductCategory
export { sizeOptionsByCategory }

export const CATEGORY_SLUGS: CategorySlug[] = [...productCategories]

export const categoryMeta: Record<CategorySlug, { title: string; description: string; image?: string }> = {
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
  kidswear: {
    title: "Kidswear",
    description: "Considered occasionwear and everyday pieces designed for children with comfort, movement, and individuality in mind.",
  },
  accessories: {
    title: "Accessories",
    description: "Finishing pieces that bring material, craft, and character to every look.",
  },
}

export function isCategorySlug(value: string): value is CategorySlug {
  return (CATEGORY_SLUGS as string[]).includes(value)
}

const bySlug = new Map(products.map((product) => [product.slug, product]))

export function getProduct(slug: string): Product | undefined {
  return bySlug.get(slug)
}

export function categoryOf(slug: string): CategorySlug | null {
  return bySlug.get(slug)?.category ?? null
}

export function getCategoryProducts(category: CategorySlug): Product[] {
  return products.filter((product) => product.category === category)
}

export const ACTIVE_CATEGORY_SLUGS: CategorySlug[] = CATEGORY_SLUGS.filter((category) => getCategoryProducts(category).length > 0)

export function isActiveCategorySlug(value: string): value is CategorySlug {
  return isCategorySlug(value) && ACTIVE_CATEGORY_SLUGS.includes(value)
}

export function getCategoryImage(category: CategorySlug): string {
  return categoryMeta[category].image || getCategoryProducts(category)[0]?.coverImage || "/images/hero/poster.jpg"
}

export function getAllProducts(): Product[] {
  return products
}

const classificationBySlug = new Map(classifications.map((classification) => [classification.slug, classification]))

export function getClassification(slug: string): Classification | undefined {
  return classificationBySlug.get(slug)
}

export function getClassifications(category: CategorySlug): Classification[] {
  const present = new Set(products.filter((product) => product.category === category).map((product) => product.classification))
  return classifications.filter((classification) => present.has(classification.slug))
}

export function getClassificationProducts(category: CategorySlug, classification: string): Product[] {
  return products.filter((product) => product.category === category && product.classification === classification)
}

export const NEW_ARRIVALS_WINDOW_DAYS = 90

export function getNewArrivals(category: CategorySlug, now: Date = new Date()): Product[] {
  const pool = getCategoryProducts(category)
  if (pool.length === 0) return []

  const cutoff = new Date(now.getTime() - NEW_ARRIVALS_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  const byNewest = (a: Product, b: Product) => b.releaseDate.localeCompare(a.releaseDate) || a.order - b.order

  const recent = pool.filter((product) => product.releaseDate >= cutoff).sort(byNewest)
  if (recent.length > 0) return recent

  const latest = pool.reduce((max, product) => (product.releaseDate > max ? product.releaseDate : max), pool[0].releaseDate)
  return pool.filter((product) => product.releaseDate === latest).sort(byNewest)
}

const collectionBySlug = new Map(collections.map((collection) => [collection.slug, collection]))

export function getCollection(slug: string): Collection | undefined {
  return collectionBySlug.get(slug)
}

export function getCollections(): Collection[] {
  return collections
}

export function getCollectionProducts(slug: string): Product[] {
  return products.filter((product) => product.collection === slug)
}

export type CategoryView = { slug: string; title: string; kind: "new-arrivals" | "classification" | "bestsellers" }

export function getCategoryViews(category: CategorySlug): CategoryView[] {
  const categoryProducts = getCategoryProducts(category)
  if (categoryProducts.length === 0) return []

  const views: CategoryView[] = [
    { slug: "new-arrivals", title: "New Arrivals", kind: "new-arrivals" },
    ...getClassifications(category).map((classification) => ({
      slug: classification.slug,
      title: classification.title,
      kind: "classification" as const,
    })),
  ]

  if (categoryProducts.some((product) => product.bestseller)) {
    views.push({ slug: "bestsellers", title: "Bestsellers", kind: "bestsellers" })
  }

  return views
}
