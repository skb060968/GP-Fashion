import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import sitemap, { STATIC_PATHS, categoryBasePaths, categoryViewPaths } from "@/app/sitemap"
import {
  ACTIVE_CATEGORY_SLUGS,
  CATEGORY_SLUGS,
  getAllProducts,
  getCategoryProducts,
  getCollections,
} from "@/lib/data/categories"

const BASE_URL = process.env.SITE_URL || "https://gpfashion.in"

describe("Sitemap completeness", () => {
  const entries = sitemap()
  const urls = entries.map((entry) => entry.url)

  it("contains every static public page", () => {
    for (const page of STATIC_PATHS) expect(urls).toContain(`${BASE_URL}${page.path}`)
  })

  it("contains only populated category bases and views", () => {
    for (const category of CATEGORY_SLUGS) {
      const active = ACTIVE_CATEGORY_SLUGS.includes(category)
      expect(urls.includes(`${BASE_URL}/${category}`)).toBe(active)
      expect(urls.includes(`${BASE_URL}/${category}/new-arrivals`)).toBe(active)
      const hasFlaggedBestseller = getCategoryProducts(category).some((product) => product.bestseller)
      expect(urls.includes(`${BASE_URL}/${category}/bestsellers`)).toBe(active && hasFlaggedBestseller)
    }
    for (const path of categoryBasePaths()) expect(urls).toContain(`${BASE_URL}${path}`)
    for (const path of categoryViewPaths()) expect(urls).toContain(`${BASE_URL}${path}`)
  })

  it("contains every collection", () => {
    for (const collection of getCollections()) expect(urls).toContain(`${BASE_URL}/collections/${collection.slug}`)
  })

  it("contains every storefront product", () => {
    for (const product of getAllProducts()) expect(urls).toContain(`${BASE_URL}/shop/${product.slug}`)
  })

  it("does not list removed sections", () => {
    for (const gone of ["/about", "/journal", "/recognitions"]) {
      expect(urls.some((url) => url.startsWith(`${BASE_URL}${gone}`))).toBe(false)
    }
  })

  it("has no duplicate URLs", () => {
    expect(new Set(urls).size).toBe(urls.length)
  })

  it("every entry has lastModified, changeFrequency and priority", () => {
    const indexArb = fc.integer({ min: 0, max: entries.length - 1 })
    fc.assert(
      fc.property(indexArb, (index) => {
        const entry = entries[index]
        expect(typeof entry.lastModified).toBe("string")
        expect(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).toContain(entry.changeFrequency)
        expect(entry.priority).toBeGreaterThanOrEqual(0)
        expect(entry.priority).toBeLessThanOrEqual(1)
      }),
      { numRuns: 100 }
    )
  })

  it("has the expected total number of entries", () => {
    expect(entries.length).toBe(STATIC_PATHS.length + categoryBasePaths().length + categoryViewPaths().length + getCollections().length + getAllProducts().length)
  })
})
