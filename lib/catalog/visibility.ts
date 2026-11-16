import { cache } from "react"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createCatalog, type Catalog } from "@/lib/data/categories"

export const getHiddenSlugs = cache(async (): Promise<string[]> => {
  const rows = await prisma.hiddenProduct.findMany({ select: { slug: true }, orderBy: { slug: "asc" } })
  return rows.map((row) => row.slug)
})

export const getVisibleCatalog = cache(async (): Promise<Catalog> => createCatalog(await getHiddenSlugs()))

export function refreshStorefront() {
  revalidatePath("/", "layout")
  revalidatePath("/sitemap.xml")
}
