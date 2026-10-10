import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterProducts, FilterCriteria } from "../filterProducts";

interface TestProduct {
  name: string;
  sizes: string[];
  price: number;
}

const VALID_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "2-3Y", "7-8Y", "13-14Y", "ONE SIZE"] as const;

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

describe("Product Filtering - Property Tests", () => {

  describe("Property 7: Product filter returns only matching products", () => {

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

  describe("Property 8: Clearing filters restores full catalog", () => {

    it("applying filters then clearing all filters restores the original product list", () => {
      fc.assert(
        fc.property(productListArb, filterCriteriaArb, (products, filters) => {

          const filtered = filterProducts(products, filters);

          const clearedFilters: FilterCriteria = {
            searchText: "",
            selectedSizes: [],
            priceMin: 0,
            priceMax: 0,
          };
          const restored = filterProducts(products, clearedFilters);

          expect(restored).toEqual(products);
        }),
        { numRuns: 100 }
      );
    });
  });
});
