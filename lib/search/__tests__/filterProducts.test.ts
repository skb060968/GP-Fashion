import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterProducts, FilterCriteria } from "../filterProducts";

// --- Types ---

interface TestProduct {
  name: string;
  sizes: string[];
  price: number;
}

// --- Constants ---

const VALID_SIZES = ["S", "M", "L", "XL"] as const;

// --- Generators ---

const productArb: fc.Arbitrary<TestProduct> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  sizes: fc
    .subarray([...VALID_SIZES], { minLength: 1, maxLength: 4 })
    .map((arr) => [...arr]),
  price: fc.integer({ min: 1, max: 1000000 }),
});

const productListArb = fc.array(productArb, { minLength: 0, maxLength: 20 });

const filterCriteriaArb: fc.Arbitrary<FilterCriteria> = fc.record({
  searchText: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 10 })),
  selectedSizes: fc
    .subarray([...VALID_SIZES], { minLength: 0, maxLength: 4 })
    .map((arr) => [...arr]),
  priceMin: fc.oneof(fc.constant(0), fc.integer({ min: 1, max: 500000 })),
  priceMax: fc.oneof(fc.constant(0), fc.integer({ min: 1, max: 1000000 })),
});

// --- Helper: check if a product matches all active filter conditions ---

function matchesAllFilters(product: TestProduct, filters: FilterCriteria): boolean {
  if (filters.searchText) {
    if (!product.name.toLowerCase().includes(filters.searchText.toLowerCase())) {
      return false;
    }
  }

  if (filters.selectedSizes.length > 0) {
    if (!filters.selectedSizes.some((size) => product.sizes.includes(size))) {
      return false;
    }
  }

  if (filters.priceMin > 0) {
    if (product.price < filters.priceMin) {
      return false;
    }
  }

  if (filters.priceMax > 0) {
    if (product.price > filters.priceMax) {
      return false;
    }
  }

  return true;
}

// --- Property Tests ---

describe("Product Filtering - Property Tests", () => {
  // Feature: website-improvements, Property 7: Product filter returns only matching products
  describe("Property 7: Product filter returns only matching products", () => {
    /**
     * Validates: Requirements 3.2, 3.4, 3.5, 3.6
     */
    it("every product in the result satisfies ALL active filter conditions", () => {
      fc.assert(
        fc.property(productListArb, filterCriteriaArb, (products, filters) => {
          const result = filterProducts(products, filters);

          for (const product of result) {
            expect(matchesAllFilters(product, filters)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("every product in the original list that satisfies all conditions appears in the result", () => {
      fc.assert(
        fc.property(productListArb, filterCriteriaArb, (products, filters) => {
          const result = filterProducts(products, filters);

          const expectedMatches = products.filter((p) => matchesAllFilters(p, filters));
          expect(result.length).toBe(expectedMatches.length);

          for (const expected of expectedMatches) {
            expect(result).toContain(expected);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: website-improvements, Property 8: Clearing filters restores full catalog
  describe("Property 8: Clearing filters restores full catalog", () => {
    /**
     * Validates: Requirements 3.8
     */
    it("applying filters then clearing all filters restores the original product list", () => {
      fc.assert(
        fc.property(productListArb, filterCriteriaArb, (products, filters) => {
          // Apply some filters first
          const filtered = filterProducts(products, filters);

          // Clear all filters
          const clearedFilters: FilterCriteria = {
            searchText: "",
            selectedSizes: [],
            priceMin: 0,
            priceMax: 0,
          };
          const restored = filterProducts(products, clearedFilters);

          // Restored result should equal the original product list
          expect(restored).toEqual(products);
        }),
        { numRuns: 100 }
      );
    });
  });
});
