// lib/data/categories.ts
// Category metadata and lookups over the generated catalogue (lib/data/shop.ts).

import { products, type Product, type ProductCategory } from "./shop"

export type { Product }
export type CategorySlug = ProductCategory

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
