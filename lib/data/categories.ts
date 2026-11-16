import {
  products,
  classifications,
  productCategories,
  sizeOptionsByCategory,
  type Product,
  type ProductColor,
  type ProductCategory,
  type Classification,
} from "./shop"
import { collections, type Collection } from "./collections"

export type { Product, ProductColor, Classification, Collection }
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

const classificationBySlug = new Map(classifications.map((classification) => [classification.slug, classification]))

export function getClassification(slug: string): Classification | undefined {
  return classificationBySlug.get(slug)
}

export const NEW_ARRIVALS_WINDOW_DAYS = 90

export function isNewProduct(product: Pick<Product, "releaseDate">, now: Date = new Date()): boolean {
  if (!product.releaseDate) return false
  const cutoff = new Date(now.getTime() - NEW_ARRIVALS_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
  return product.releaseDate >= cutoff
}

const collectionBySlug = new Map(collections.map((collection) => [collection.slug, collection]))

export function getCollection(slug: string): Collection | undefined {
  return collectionBySlug.get(slug)
}

export function getCollections(): Collection[] {
  return collections
}

export type CategoryView = { slug: string; title: string; kind: "new-arrivals" | "classification" | "bestsellers" }

export type StoreProduct = Product & { soldOut?: boolean }

export function soldOutLast<T extends object>(items: T[]): T[] {
  const isOut = (item: T) => (item as { soldOut?: boolean }).soldOut === true
  if (!items.some(isOut)) return items
  return [...items.filter((item) => !isOut(item)), ...items.filter(isOut)]
}

export function createCatalog(hiddenSlugs: Iterable<string> = [], soldOutSlugs: Iterable<string> = []) {
  const hidden: ReadonlySet<string> = new Set(hiddenSlugs)
  const soldOut: ReadonlySet<string> = new Set([...soldOutSlugs].filter((slug) => !hidden.has(slug)))
  const visible = hidden.size ? products.filter((product) => !hidden.has(product.slug)) : products
  const list: StoreProduct[] = soldOut.size
    ? soldOutLast(visible.map((product) => (soldOut.has(product.slug) ? { ...product, soldOut: true } : product)))
    : visible
  const bySlug = new Map(list.map((product) => [product.slug, product]))

  const getProduct = (slug: string): StoreProduct | undefined => bySlug.get(slug)

  const isSoldOut = (slug: string): boolean => soldOut.has(slug)

  const getCategoryProducts = (category: CategorySlug): StoreProduct[] => list.filter((product) => product.category === category)

  const activeCategorySlugs: CategorySlug[] = CATEGORY_SLUGS.filter((category) => getCategoryProducts(category).length > 0)

  const isActiveCategorySlug = (value: string): value is CategorySlug => isCategorySlug(value) && activeCategorySlugs.includes(value)

  const getCategoryImage = (category: CategorySlug): string =>
    categoryMeta[category].image || getCategoryProducts(category)[0]?.coverImage || "/images/hero/poster.jpg"

  const getClassifications = (category: CategorySlug): Classification[] => {
    const present = new Set(getCategoryProducts(category).map((product) => product.classification))
    return classifications.filter((classification) => present.has(classification.slug))
  }

  const getClassificationProducts = (category: CategorySlug, classification: string): StoreProduct[] =>
    list.filter((product) => product.category === category && product.classification === classification)

  const getRelatedProducts = (product: Product, limit = 4): StoreProduct[] => {
    const others = list.filter((p) => p.slug !== product.slug && !p.soldOut)
    const score = (p: Product) =>
      (p.collection && p.collection === product.collection ? 2 : 0) +
      (p.category === product.category ? 2 : 0) +
      (p.classification === product.classification ? 1 : 0)
    return others
      .map((p) => ({ p, s: score(p) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || a.p.order - b.p.order || a.p.name.localeCompare(b.p.name))
      .slice(0, limit)
      .map((x) => x.p)
  }

  const getNewArrivals = (category: CategorySlug, now: Date = new Date()): StoreProduct[] => {
    const pool = getCategoryProducts(category)
    if (pool.length === 0) return []

    const cutoff = new Date(now.getTime() - NEW_ARRIVALS_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10)
    const byNewest = (a: Product, b: Product) => b.releaseDate.localeCompare(a.releaseDate) || a.order - b.order

    const recent = pool.filter((product) => product.releaseDate >= cutoff).sort(byNewest)
    if (recent.length > 0) return soldOutLast(recent)

    const latest = pool.reduce((max, product) => (product.releaseDate > max ? product.releaseDate : max), pool[0].releaseDate)
    return soldOutLast(pool.filter((product) => product.releaseDate === latest).sort(byNewest))
  }

  const getCollectionProducts = (slug: string): StoreProduct[] => list.filter((product) => product.collection === slug)

  const getCategoryViews = (category: CategorySlug): CategoryView[] => {
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

  return {
    hidden,
    soldOut,
    products: list,
    getProduct,
    isSoldOut,
    getCategoryProducts,
    activeCategorySlugs,
    isActiveCategorySlug,
    getCategoryImage,
    getClassifications,
    getClassificationProducts,
    getRelatedProducts,
    getNewArrivals,
    getCollectionProducts,
    getCategoryViews,
  }
}

export type Catalog = ReturnType<typeof createCatalog>

export const fullCatalog: Catalog = createCatalog()

export const getProduct = fullCatalog.getProduct
export const getCategoryProducts = fullCatalog.getCategoryProducts
export const ACTIVE_CATEGORY_SLUGS: CategorySlug[] = fullCatalog.activeCategorySlugs
export const isActiveCategorySlug = fullCatalog.isActiveCategorySlug
export const getCategoryImage = fullCatalog.getCategoryImage
export const getClassifications = fullCatalog.getClassifications
export const getClassificationProducts = fullCatalog.getClassificationProducts
export const getRelatedProducts = fullCatalog.getRelatedProducts
export const getNewArrivals = fullCatalog.getNewArrivals
export const getCollectionProducts = fullCatalog.getCollectionProducts
export const getCategoryViews = fullCatalog.getCategoryViews

export function categoryOf(slug: string): CategorySlug | null {
  return getProduct(slug)?.category ?? null
}

export function getAllProducts(): Product[] {
  return products
}

export type NavCategory = { slug: CategorySlug; title: string; views: { slug: string; title: string }[] }
export type StorefrontNav = { categories: NavCategory[]; collections: { slug: string; name: string }[] }

export function storefrontNav(catalog: Catalog): StorefrontNav {
  return {
    categories: catalog.activeCategorySlugs.map((category) => ({
      slug: category,
      title: categoryMeta[category].title,
      views: catalog.getCategoryViews(category).map((view) => ({ slug: view.slug, title: view.title })),
    })),
    collections: getCollections().map((collection) => ({ slug: collection.slug, name: collection.name })),
  }
}
