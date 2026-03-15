// Feature: website-improvements, Property 17: Each public page has unique metadata
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getAllPageMetadata } from "@/lib/seo/metadata";

/**
 * Validates: Requirements 7.5, 7.6
 */

describe("Page Metadata Uniqueness - Property Tests", () => {
  const pages = getAllPageMetadata();

  it("all titles are unique across pages", () => {
    const titles = pages.map((p) => p.title);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(titles.length);
  });

  it("each page has a non-empty description", () => {
    for (const page of pages) {
      expect(page.description.length).toBeGreaterThan(0);
    }
  });

  it("each page has Open Graph tags (og:title, og:description, og:image, og:url)", () => {
    for (const page of pages) {
      expect(page.ogTitle.length).toBeGreaterThan(0);
      expect(page.ogDescription.length).toBeGreaterThan(0);
      expect(page.ogImage.length).toBeGreaterThan(0);
      expect(page.ogUrl.length).toBeGreaterThan(0);
    }
  });

  it("any two distinct pages have different titles (property-based)", () => {
    const indexArb = fc.integer({ min: 0, max: pages.length - 1 });

    fc.assert(
      fc.property(indexArb, indexArb, (i, j) => {
        if (i !== j) {
          expect(pages[i].title).not.toBe(pages[j].title);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("every page has non-empty description and OG tags (property-based)", () => {
    const indexArb = fc.integer({ min: 0, max: pages.length - 1 });

    fc.assert(
      fc.property(indexArb, (idx) => {
        const page = pages[idx];
        expect(page.description.length).toBeGreaterThan(0);
        expect(page.ogTitle.length).toBeGreaterThan(0);
        expect(page.ogDescription.length).toBeGreaterThan(0);
        expect(page.ogImage).toMatch(/^https?:\/\//);
        expect(page.ogUrl).toMatch(/^https?:\/\//);
      }),
      { numRuns: 100 },
    );
  });
});
