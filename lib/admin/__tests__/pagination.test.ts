import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  paginateOrders,
  filterOrders,
  OrderSummary,
} from "../orderListHelpers";

// --- Constants ---

const ORDER_STATUSES = [
  "UNDER_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

// --- Generators ---

const orderArb: fc.Arbitrary<OrderSummary & { createdAt: Date }> = fc.record({
  orderCode: fc.string({ minLength: 1, maxLength: 20 }),
  status: fc.constantFrom(...ORDER_STATUSES),
  createdAt: fc.date({
    min: new Date("2024-01-01"),
    max: new Date("2026-12-31"),
  }),
});

const orderListArb = fc.array(orderArb, { minLength: 0, maxLength: 60 });

// --- Property Tests ---

describe("Admin Order Pagination and Search - Property Tests", () => {
  // Feature: website-improvements, Property 12: Admin order pagination returns correct page size and sort order
  describe("Property 12: Admin order pagination returns correct page size and sort order", () => {
    /**
     * Validates: Requirements 5.1, 5.3, 5.4
     */
    it("result length is at most pageSize (20)", () => {
      fc.assert(
        fc.property(
          orderListArb,
          fc.integer({ min: 1, max: 10 }),
          (orders, page) => {
            const result = paginateOrders(orders, page);
            expect(result.orders.length).toBeLessThanOrEqual(20);
            expect(result.pageSize).toBe(20);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("results are sorted by createdAt descending", () => {
      fc.assert(
        fc.property(
          orderListArb,
          fc.integer({ min: 1, max: 5 }),
          (orders, page) => {
            const result = paginateOrders(orders, page);
            for (let i = 1; i < result.orders.length; i++) {
              expect(
                result.orders[i - 1].createdAt.getTime()
              ).toBeGreaterThanOrEqual(result.orders[i].createdAt.getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("totalPages equals Math.ceil(totalCount / pageSize)", () => {
      fc.assert(
        fc.property(
          orderListArb,
          fc.integer({ min: 1, max: 10 }),
          (orders, page) => {
            const result = paginateOrders(orders, page);
            const expected =
              orders.length === 0
                ? 0
                : Math.ceil(orders.length / 20);
            expect(result.totalPages).toBe(expected);
            expect(result.totalCount).toBe(orders.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: website-improvements, Property 13: Admin order search and status filter returns only matching orders
  describe("Property 13: Admin order search and status filter returns only matching orders", () => {
    /**
     * Validates: Requirements 5.6, 5.8
     */
    it("every order in the result has orderCode containing the search text (if provided)", () => {
      fc.assert(
        fc.property(
          orderListArb,
          fc.string({ minLength: 1, maxLength: 5 }),
          (orders, search) => {
            const result = filterOrders(orders, search, "All");
            for (const order of result) {
              expect(order.orderCode).toContain(search);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("every order in the result has status matching the filter (if not 'All')", () => {
      fc.assert(
        fc.property(
          orderListArb,
          fc.constantFrom(...ORDER_STATUSES),
          (orders, status) => {
            const result = filterOrders(orders, "", status);
            for (const order of result) {
              expect(order.status).toBe(status);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("combined search and status filter returns only orders matching both conditions", () => {
      fc.assert(
        fc.property(
          orderListArb,
          fc.string({ minLength: 0, maxLength: 5 }),
          fc.constantFrom("All", ...ORDER_STATUSES),
          (orders, search, status) => {
            const result = filterOrders(orders, search, status);

            for (const order of result) {
              if (search) {
                expect(order.orderCode).toContain(search);
              }
              if (status !== "All") {
                expect(order.status).toBe(status);
              }
            }

            // Completeness: every matching order from the original list is in the result
            const expected = orders.filter((o) => {
              if (search && !o.orderCode.includes(search)) return false;
              if (status !== "All" && o.status !== status) return false;
              return true;
            });
            expect(result.length).toBe(expected.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
