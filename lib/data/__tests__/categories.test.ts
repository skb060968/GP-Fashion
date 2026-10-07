import { describe, it, expect } from "vitest";
import {
  CATEGORY_SLUGS,
  getAllProducts,
  getCategoryProducts,
  getCategoryViews,
  getClassification,
  getClassifications,
  getClassificationProducts,
  getCollection,
  getCollectionProducts,
  getCollections,
  getNewArrivals,
  getProduct,
  NEW_ARRIVALS_WINDOW_DAYS,
} from "@/lib/data/categories";
import { rankBySales, manualBestsellers } from "@/lib/services/bestsellers";

describe("catalogue integrity", () => {
  const all = getAllProducts();

  it("has at least one product", () => {
    expect(all.length).toBeGreaterThan(0);
  });

  it("every product resolves by slug and has a known classification", () => {
    for (const p of all) {
      expect(getProduct(p.slug)).toBe(p);
      expect(getClassification(p.classification)).toBeDefined();
      expect(CATEGORY_SLUGS).toContain(p.category);
      expect(p.releaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every product's collection exists and lists it back", () => {
    for (const p of all) {
      if (!p.collection) continue;
      expect(getCollection(p.collection)).toBeDefined();
      expect(getCollectionProducts(p.collection)).toContain(p);
    }
  });

  it("category products partition the catalogue", () => {
    const total = CATEGORY_SLUGS.reduce((n, c) => n + getCategoryProducts(c).length, 0);
    expect(total).toBe(all.length);
  });

  it("collections are listed in display order", () => {
    const cs = getCollections();
    for (let i = 1; i < cs.length; i++) {
      const a = cs[i - 1], b = cs[i];
      expect(a.order < b.order || (a.order === b.order && a.releaseDate >= b.releaseDate)).toBe(true);
    }
  });
});

describe("classifications and views", () => {
  for (const c of CATEGORY_SLUGS) {
    it(`${c}: only classifications with products are listed, and they cover every product`, () => {
      const listed = getClassifications(c);
      for (const cl of listed) expect(getClassificationProducts(c, cl.slug).length).toBeGreaterThan(0);
      const covered = listed.reduce((n, cl) => n + getClassificationProducts(c, cl.slug).length, 0);
      expect(covered).toBe(getCategoryProducts(c).length);
    });

    it(`${c}: views contain New Arrivals, populated classifications, and Bestsellers only when flagged`, () => {
      const views = getCategoryViews(c);
      const categoryProducts = getCategoryProducts(c);
      const expectedClassifications = getClassifications(c).map((x) => x.slug);
      const classificationViews = views.filter((view) => view.kind === "classification");
      const hasFlaggedBestseller = categoryProducts.some((product) => product.bestseller);

      expect(views[0]).toMatchObject({ slug: "new-arrivals", kind: "new-arrivals" });
      expect(classificationViews.map((view) => view.slug)).toEqual(expectedClassifications);
      expect(views.some((view) => view.slug === "bestsellers")).toBe(hasFlaggedBestseller);
      if (hasFlaggedBestseller) {
        expect(views[views.length - 1]).toMatchObject({ slug: "bestsellers", kind: "bestsellers" });
      }
    });
  }
});

describe("new arrivals", () => {
  for (const c of CATEGORY_SLUGS) {
    const pool = getCategoryProducts(c);
    if (pool.length === 0) continue;
    const latest = pool.map((p) => p.releaseDate).sort().at(-1)!;

    it(`${c}: within the window returns everything released recently, newest first`, () => {
      const now = new Date(`${latest}T12:00:00Z`);
      const result = getNewArrivals(c, now);
      expect(result.length).toBeGreaterThan(0);
      for (let i = 1; i < result.length; i++) expect(result[i - 1].releaseDate >= result[i].releaseDate).toBe(true);
      for (const p of result) expect(p.category).toBe(c);
    });

    it(`${c}: long after the window falls back to the most recent release`, () => {
      const farFuture = new Date(new Date(`${latest}T00:00:00Z`).getTime() + (NEW_ARRIVALS_WINDOW_DAYS + 400) * 86_400_000);
      const result = getNewArrivals(c, farFuture);
      expect(result.length).toBeGreaterThan(0);
      for (const p of result) expect(p.releaseDate).toBe(latest);
    });
  }
});

describe("bestsellers ranking", () => {
  const pool = [{ slug: "a" }, { slug: "b" }, { slug: "c" }, { slug: "d" }];

  it("orders by units sold and drops products with no sales", () => {
    const units = new Map([["a", 2], ["c", 9], ["d", 5]]);
    expect(rankBySales(pool, units).map((p) => p.slug)).toEqual(["c", "d", "a"]);
  });

  it("respects the limit", () => {
    const units = new Map([["a", 1], ["b", 2], ["c", 3], ["d", 4]]);
    expect(rankBySales(pool, units, 2).map((p) => p.slug)).toEqual(["d", "c"]);
  });

  it("manual fallback uses the flag in catalogue order", () => {
    for (const c of CATEGORY_SLUGS) {
      const manual = manualBestsellers(getCategoryProducts(c));
      for (const p of manual) expect(p.bestseller).toBe(true);
    }
  });
});
