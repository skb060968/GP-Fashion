import { describe, it, expect } from "vitest"
import {
  ACTIVE_CATEGORY_SLUGS,
  CATEGORY_SLUGS,
  createCatalog,
  getAllProducts,
  getCategoryProducts,
  getCategoryViews,
  storefrontNav,
  getClassification,
  getClassifications,
  getClassificationProducts,
  getCollection,
  getCollectionProducts,
  getCollections,
  getNewArrivals,
  getProduct,
  NEW_ARRIVALS_WINDOW_DAYS,
  sizeOptionsByCategory,
} from "@/lib/data/categories"
import { rankBySales, manualBestsellers } from "@/lib/services/bestsellers"

describe("catalogue integrity", () => {
  const all = getAllProducts()

  it("registers all supported categories", () => {
    expect(CATEGORY_SLUGS).toEqual(["menswear", "womenswear", "kidswear", "accessories"])
  })

  it("has at least one product", () => {
    expect(all.length).toBeGreaterThan(0)
  })

  it("every product resolves and uses valid category-specific sizes", () => {
    for (const product of all) {
      expect(getProduct(product.slug)).toBe(product)
      expect(getClassification(product.classification)).toBeDefined()
      expect(CATEGORY_SLUGS).toContain(product.category)
      expect(product.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(product.sizes.length).toBeGreaterThan(0)
      for (const size of product.sizes) expect(sizeOptionsByCategory[product.category]).toContain(size)
    }
  })

  it("active categories are exactly the categories containing products", () => {
    expect(ACTIVE_CATEGORY_SLUGS).toEqual(CATEGORY_SLUGS.filter((category) => getCategoryProducts(category).length > 0))
  })

  it("every product's collection exists and lists it back", () => {
    for (const product of all) {
      if (!product.collection) continue
      expect(getCollection(product.collection)).toBeDefined()
      expect(getCollectionProducts(product.collection)).toContain(product)
    }
  })

  it("category products partition the catalogue", () => {
    const total = CATEGORY_SLUGS.reduce((count, category) => count + getCategoryProducts(category).length, 0)
    expect(total).toBe(all.length)
  })

  it("collections are listed in display order", () => {
    const collections = getCollections()
    for (let index = 1; index < collections.length; index++) {
      const previous = collections[index - 1]
      const current = collections[index]
      expect(previous.order < current.order || (previous.order === current.order && previous.releaseDate >= current.releaseDate)).toBe(true)
    }
  })
})

describe("classifications and views", () => {
  for (const category of CATEGORY_SLUGS) {
    it(`${category}: only classifications with products are listed, and they cover every product`, () => {
      const listed = getClassifications(category)
      for (const classification of listed) expect(getClassificationProducts(category, classification.slug).length).toBeGreaterThan(0)
      const covered = listed.reduce((count, classification) => count + getClassificationProducts(category, classification.slug).length, 0)
      expect(covered).toBe(getCategoryProducts(category).length)
    })

    it(`${category}: empty categories have no views; active categories have only available views`, () => {
      const views = getCategoryViews(category)
      const categoryProducts = getCategoryProducts(category)
      if (categoryProducts.length === 0) {
        expect(views).toEqual([])
        return
      }

      const expectedClassifications = getClassifications(category).map((classification) => classification.slug)
      const classificationViews = views.filter((view) => view.kind === "classification")
      const hasFlaggedBestseller = categoryProducts.some((product) => product.bestseller)

      expect(views[0]).toMatchObject({ slug: "new-arrivals", kind: "new-arrivals" })
      expect(classificationViews.map((view) => view.slug)).toEqual(expectedClassifications)
      expect(views.some((view) => view.slug === "bestsellers")).toBe(hasFlaggedBestseller)
      if (hasFlaggedBestseller) expect(views.at(-1)).toMatchObject({ slug: "bestsellers", kind: "bestsellers" })
    })
  }
})

describe("new arrivals", () => {
  for (const category of CATEGORY_SLUGS) {
    const pool = getCategoryProducts(category)
    if (pool.length === 0) continue
    const latest = pool.map((product) => product.releaseDate).sort().at(-1)!

    it(`${category}: within the window returns everything released recently, newest first`, () => {
      const result = getNewArrivals(category, new Date(`${latest}T12:00:00Z`))
      expect(result.length).toBeGreaterThan(0)
      for (let index = 1; index < result.length; index++) expect(result[index - 1].releaseDate >= result[index].releaseDate).toBe(true)
      for (const product of result) expect(product.category).toBe(category)
    })

    it(`${category}: long after the window falls back to the most recent release`, () => {
      const farFuture = new Date(new Date(`${latest}T00:00:00Z`).getTime() + (NEW_ARRIVALS_WINDOW_DAYS + 400) * 86_400_000)
      const result = getNewArrivals(category, farFuture)
      expect(result.length).toBeGreaterThan(0)
      for (const product of result) expect(product.releaseDate).toBe(latest)
    })
  }
})

describe("hidden products", () => {
  const all = getAllProducts()
  const target = all.find((product) => getCategoryProducts(product.category).length > 1) ?? all[0]

  it("with nothing hidden matches the full catalogue", () => {
    const catalog = createCatalog([])
    expect(catalog.products).toEqual(all)
    expect(catalog.activeCategorySlugs).toEqual(ACTIVE_CATEGORY_SLUGS)
  })

  it("removes a hidden product from every listing", () => {
    const catalog = createCatalog([target.slug])
    expect(catalog.getProduct(target.slug)).toBeUndefined()
    expect(catalog.products.some((p) => p.slug === target.slug)).toBe(false)
    expect(catalog.getCategoryProducts(target.category).some((p) => p.slug === target.slug)).toBe(false)
    expect(catalog.getClassificationProducts(target.category, target.classification).some((p) => p.slug === target.slug)).toBe(false)
    expect(catalog.getNewArrivals(target.category).some((p) => p.slug === target.slug)).toBe(false)
    if (target.collection) expect(catalog.getCollectionProducts(target.collection).some((p) => p.slug === target.slug)).toBe(false)
    for (const other of catalog.products) expect(catalog.getRelatedProducts(other, 10).some((p) => p.slug === target.slug)).toBe(false)
  })

  it("keeps the full catalogue unchanged for admin and page generation", () => {
    createCatalog([target.slug])
    expect(getProduct(target.slug)).toBe(target)
    expect(getAllProducts()).toContain(target)
  })

  it("drops a category from the menu once all its products are hidden", () => {
    const category = ACTIVE_CATEGORY_SLUGS[0]
    const catalog = createCatalog(getCategoryProducts(category).map((p) => p.slug))
    expect(catalog.activeCategorySlugs).not.toContain(category)
    expect(catalog.getCategoryViews(category)).toEqual([])
    expect(catalog.isActiveCategorySlug(category)).toBe(false)
    expect(storefrontNav(catalog).categories.some((c) => c.slug === category)).toBe(false)
  })

  it("drops a classification view when its only products are hidden", () => {
    for (const category of ACTIVE_CATEGORY_SLUGS) {
      for (const classification of getClassifications(category)) {
        const members = getClassificationProducts(category, classification.slug)
        if (members.length === getCategoryProducts(category).length) continue
        const catalog = createCatalog(members.map((p) => p.slug))
        expect(catalog.getCategoryViews(category).some((view) => view.slug === classification.slug)).toBe(false)
        return
      }
    }
  })

  it("ignores unknown slugs", () => {
    expect(createCatalog(["no-such-piece"]).products).toEqual(all)
  })
})

describe("bestsellers ranking", () => {
  const pool = [{ slug: "a" }, { slug: "b" }, { slug: "c" }, { slug: "d" }]

  it("orders by units sold and drops products with no sales", () => {
    const units = new Map([["a", 2], ["c", 9], ["d", 5]])
    expect(rankBySales(pool, units).map((product) => product.slug)).toEqual(["c", "d", "a"])
  })

  it("respects the limit", () => {
    const units = new Map([["a", 1], ["b", 2], ["c", 3], ["d", 4]])
    expect(rankBySales(pool, units, 2).map((product) => product.slug)).toEqual(["d", "c"])
  })

  it("manual fallback uses the flag in catalogue order", () => {
    for (const category of CATEGORY_SLUGS) {
      const manual = manualBestsellers(getCategoryProducts(category))
      for (const product of manual) expect(product.bestseller).toBe(true)
    }
  })
})
