// lib/data/categories.ts
// Standby category listings derived from the legacy collections/dresses data.
// To be replaced with real product data once the catalogue is restructured.

import { collections } from "./collections"
import { dresses } from "./shop"

export type Product = (typeof dresses)[number]

export type CategorySlug = "menswear" | "womenswear"

export const categoryMeta: Record<
  CategorySlug,
  { title: string; description: string; image: string }
> = {
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

function slugsFor(category: CategorySlug): string[] {
  const picked = collections.filter((c) => {
    const cat = "category" in c ? c.category : undefined
    return category === "menswear" ? cat === "menswear" : cat === undefined
  })
  // Preserve collection order, de-duplicate.
  return Array.from(new Set(picked.flatMap((c) => c.dresses)))
}

export function getCategoryProducts(category: CategorySlug): Product[] {
  const order = slugsFor(category)
  return order
    .map((slug) => dresses.find((d) => d.slug === slug))
    .filter((d): d is Product => Boolean(d))
}
