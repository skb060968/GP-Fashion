import { cache } from "react"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createCatalog, type Catalog } from "@/lib/data/categories"

export type ProductStatusLists = { hidden: string[]; soldOut: string[] }

export const getProductStatusLists = cache(async (): Promise<ProductStatusLists> => {
  const [hidden, soldOut] = await Promise.all([
    prisma.hiddenProduct.findMany({ select: { slug: true }, orderBy: { slug: "asc" } }),
    prisma.soldOutProduct.findMany({ select: { slug: true }, orderBy: { slug: "asc" } }),
  ])
  const hiddenSlugs = hidden.map((row) => row.slug)
  const hiddenSet = new Set(hiddenSlugs)
  return { hidden: hiddenSlugs, soldOut: soldOut.map((row) => row.slug).filter((slug) => !hiddenSet.has(slug)) }
})

export const getVisibleCatalog = cache(async (): Promise<Catalog> => {
  const { hidden, soldOut } = await getProductStatusLists()
  return createCatalog(hidden, soldOut)
})

export function refreshStorefront() {
  revalidatePath("/", "layout")
  revalidatePath("/sitemap.xml")
}
