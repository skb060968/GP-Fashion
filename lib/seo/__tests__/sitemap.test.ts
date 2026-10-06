import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import sitemap, { STATIC_PATHS } from "@/app/sitemap";
import { getAllProducts } from "@/lib/data/categories";

const BASE_URL = process.env.SITE_URL || "https://gpfashion.in";

describe("Sitemap completeness", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("contains every static public page", () => {
    for (const p of STATIC_PATHS) expect(urls).toContain(`${BASE_URL}${p.path}`);
  });

  it("contains every storefront product", () => {
    for (const d of getAllProducts()) expect(urls).toContain(`${BASE_URL}/shop/${d.slug}`);
  });

  it("does not list removed sections", () => {
    for (const gone of ["/about", "/collections", "/journal", "/recognitions"]) {
      expect(urls.some((u) => u.startsWith(`${BASE_URL}${gone}`))).toBe(false);
    }
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

  it("total entries equals static pages plus products", () => {
    expect(entries.length).toBe(STATIC_PATHS.length + getAllProducts().length);
  });
});
