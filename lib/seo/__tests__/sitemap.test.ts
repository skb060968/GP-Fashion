import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import sitemap, { STATIC_PATHS, categoryViewPaths } from "@/app/sitemap";
import { getAllProducts, getCollections } from "@/lib/data/categories";

const BASE_URL = process.env.SITE_URL || "https://gpfashion.in";

describe("Sitemap completeness", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("contains every static public page", () => {
    for (const p of STATIC_PATHS) expect(urls).toContain(`${BASE_URL}${p.path}`);
  });

  it("contains every category view (new arrivals, classifications, bestsellers)", () => {
    for (const p of categoryViewPaths()) expect(urls).toContain(`${BASE_URL}${p}`);
    for (const c of ["menswear", "womenswear"]) {
      expect(urls).toContain(`${BASE_URL}/${c}/new-arrivals`);
      expect(urls).toContain(`${BASE_URL}/${c}/bestsellers`);
    }
  });

  it("contains every collection", () => {
    for (const c of getCollections()) expect(urls).toContain(`${BASE_URL}/collections/${c.slug}`);
  });

  it("contains every storefront product", () => {
    for (const d of getAllProducts()) expect(urls).toContain(`${BASE_URL}/shop/${d.slug}`);
  });

  it("does not list removed sections", () => {
    for (const gone of ["/about", "/journal", "/recognitions"]) {
      expect(urls.some((u) => u.startsWith(`${BASE_URL}${gone}`))).toBe(false);
    }
  });

  it("has no duplicate URLs", () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("every entry has lastModified, changeFrequency and priority (property-based)", () => {
    const indexArb = fc.integer({ min: 0, max: entries.length - 1 });
    fc.assert(
      fc.property(indexArb, (idx) => {
        const e = entries[idx];
        expect(typeof e.lastModified).toBe("string");
        expect(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).toContain(e.changeFrequency);
        expect(e.priority).toBeGreaterThanOrEqual(0);
        expect(e.priority).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  it("total entries equals static pages plus views, collections and products", () => {
    expect(entries.length).toBe(STATIC_PATHS.length + categoryViewPaths().length + getCollections().length + getAllProducts().length);
  });
});
