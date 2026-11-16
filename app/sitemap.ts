import { MetadataRoute } from "next"
import { fullCatalog, getCollections, type Catalog } from "@/lib/data/categories"
import { getVisibleCatalog } from "@/lib/catalog/visibility"

const BASE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/collections", changeFrequency: "monthly", priority: 0.8 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.8 },
  { path: "/services", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/track-order", changeFrequency: "monthly", priority: 0.4 },
  { path: "/policies/shipping-returns", changeFrequency: "yearly", priority: 0.3 },
  { path: "/policies/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/policies/privacy", changeFrequency: "yearly", priority: 0.3 },
]

export function categoryBasePaths(catalog: Catalog = fullCatalog): string[] {
  return catalog.activeCategorySlugs.map((category) => `/${category}`)
}

export function categoryViewPaths(catalog: Catalog = fullCatalog): string[] {
  return catalog.activeCategorySlugs.flatMap((category) => catalog.getCategoryViews(category).map((view) => `/${category}/${view.slug}`))
}

export function buildSitemap(catalog: Catalog = fullCatalog): MetadataRoute.Sitemap {
  const now = new Date().toISOString()
  const entry = (path: string, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  })

  const staticPages = STATIC_PATHS.map((page) => entry(page.path, page.changeFrequency, page.priority))
  const categoryPages = categoryBasePaths(catalog).map((path) => entry(path, "weekly", 0.9))
  const viewPages = categoryViewPaths(catalog).map((path) => entry(path, "weekly", 0.7))
  const collectionPages = getCollections().map((collection) => entry(`/collections/${collection.slug}`, "monthly", 0.8))
  const productPages = catalog.products.map((product) => entry(`/shop/${product.slug}`, "weekly", 0.8))

  return [...staticPages, ...categoryPages, ...viewPages, ...collectionPages, ...productPages]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap(await getVisibleCatalog())
}
