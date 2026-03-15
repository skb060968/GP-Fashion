// Feature: website-improvements, Property 16: Product JSON-LD contains required Schema.org fields
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generateProductJsonLd } from "@/lib/seo/jsonld";

/**
 * Validates: Requirements 7.4
 */

describe("Product JSON-LD - Property Tests", () => {
  const productArb = fc.record({
    name: fc.string({ minLength: 1 }),
    coverImage: fc.string({ minLength: 1 }),
    price: fc.integer({ min: 1 }),
  });

  it("contains all required Schema.org Product fields", () => {
    fc.assert(
      fc.property(productArb, (product) => {
        const jsonLd = generateProductJsonLd(product);

        expect(jsonLd["@context"]).toBe("https://schema.org");
        expect(jsonLd["@type"]).toBe("Product");
        expect(jsonLd.name).toBe(product.name);
        expect(jsonLd.image).toBeDefined();
        expect(typeof jsonLd.image).toBe("string");
        expect(jsonLd.image.length).toBeGreaterThan(0);
        expect(jsonLd.offers["@type"]).toBe("Offer");
        expect(jsonLd.offers.price).toBe(product.price / 100);
        expect(jsonLd.offers.priceCurrency).toBe("INR");
        expect(jsonLd.offers.availability).toBe(
          "https://schema.org/InStock"
        );
      }),
      { numRuns: 100 },
    );
  });
});
