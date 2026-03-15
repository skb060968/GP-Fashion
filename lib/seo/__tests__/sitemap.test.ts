// Feature: website-improvements, Property 15: Sitemap contains all public pages with required attributes
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import sitemap from "@/app/sitemap";
import { dresses } from "@/lib/data/shop";
import { collections } from "@/lib/data/collections";
import { journalPosts } from "@/lib/data/journal";

/**
 * Validates: Requirements 7.1, 7.2
 */

const BASE_URL = process.env.SITE_URL || "https://gpfashion.in";

describe("Sitemap Completeness - Property Tests", () => {
  const entries = sitemap();

  // --- Static pages ---
  const expectedStaticPaths = [
    "",
    "/collections",
    "/shop",
    "/about",
    "/services",
    "/journal",
    "/contact",
    "/track-order",
  ];

  it("contains entries for all static pages", () => {
    const urls = entries.map((e) => e.url);
    for (const path of expectedStaticPaths) {
      expect(urls).toContain(`${BASE_URL}${path}`);
    }
  });

  // --- Dynamic pages ---
  it("contains entries for every product", () => {
    const urls = entries.map((e) => e.url);
    for (const dress of dresses) {
      expect(urls).toContain(`${BASE_URL}/shop/${dress.slug}`);
    }
  });

  it("contains entries for every collection", () => {
    const urls = entries.map((e) => e.url);
    for (const collection of collections) {
      expect(urls).toContain(`${BASE_URL}/collections/${collection.slug}`);
    }
  });

  it("contains entries for every journal post", () => {
    const urls = entries.map((e) => e.url);
    for (const post of journalPosts) {
      expect(urls).toContain(`${BASE_URL}/journal/${post.slug}`);
    }
  });

  // --- Required attributes via fast-check sampling ---
  it("every entry has lastModified, changeFrequency, and priority (property-based)", () => {
    // Use fast-check to sample random indices and verify attributes
    const indexArb = fc.integer({ min: 0, max: entries.length - 1 });

    fc.assert(
      fc.property(indexArb, (idx) => {
        const entry = entries[idx];
        expect(entry.lastModified).toBeDefined();
        expect(typeof entry.lastModified).toBe("string");
        expect((entry.lastModified as string).length).toBeGreaterThan(0);

        expect(entry.changeFrequency).toBeDefined();
        expect(
          ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]
        ).toContain(entry.changeFrequency);

        expect(entry.priority).toBeDefined();
        expect(typeof entry.priority).toBe("number");
        expect(entry.priority).toBeGreaterThanOrEqual(0);
        expect(entry.priority).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });

  // --- Total count verification ---
  it("total sitemap entries equals static + products + collections + journal posts", () => {
    const expectedCount =
      expectedStaticPaths.length +
      dresses.length +
      collections.length +
      journalPosts.length;
    expect(entries.length).toBe(expectedCount);
  });
});
