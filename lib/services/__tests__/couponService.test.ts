import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// Mock prisma before importing the service
vi.mock("@/lib/prisma", () => ({
  prisma: {
    coupon: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  validateCoupon,
  calculateDiscount,
} from "../couponService";

const mockedPrisma = prisma as unknown as {
  coupon: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

// --- Generators ---

const discountTypeArb = fc.constantFrom("PERCENTAGE" as const, "FIXED" as const);

/** Generate a coupon record with random field combinations */
const couponRecordArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  code: fc.string({ minLength: 1, maxLength: 20 }),
  discountType: discountTypeArb,
  discountValue: fc.integer({ min: 1, max: 10000 }),
  minOrderAmount: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: null }),
  maxUses: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: null }),
  currentUses: fc.integer({ min: 0, max: 1000 }),
  expiresAt: fc.option(
    fc.date({
      min: new Date("2020-01-01"),
      max: new Date("2030-12-31"),
    }),
    { nil: null }
  ),
  isActive: fc.boolean(),
  createdAt: fc.constant(new Date()),
});

const orderSubtotalArb = fc.integer({ min: 1, max: 10000000 });

// --- Helpers ---

/** Determine expected validation result for a coupon + subtotal */
function expectedResult(
  coupon: {
    isActive: boolean;
    expiresAt: Date | null;
    maxUses: number | null;
    currentUses: number;
    minOrderAmount: number | null;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
  },
  orderSubtotal: number
): { valid: boolean; error?: string } {
  if (!coupon.isActive) return { valid: false, error: "INACTIVE" };
  if (coupon.expiresAt && coupon.expiresAt <= new Date())
    return { valid: false, error: "EXPIRED" };
  if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses)
    return { valid: false, error: "USAGE_LIMIT" };
  if (coupon.minOrderAmount !== null && orderSubtotal < coupon.minOrderAmount)
    return { valid: false, error: "MIN_ORDER_NOT_MET" };
  return { valid: true };
}

// --- Property Tests ---

// Feature: website-improvements, Property 9: Coupon validation correctly evaluates all conditions
describe("Property 9: Coupon validation correctly evaluates all conditions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 4.3, 4.5**
   *
   * For any coupon record and order subtotal, validateCoupon should return
   * { valid: true } if and only if the code exists, isActive is true,
   * expiresAt is in the future (or null), currentUses < maxUses (or maxUses is null),
   * and orderSubtotal >= minOrderAmount (or minOrderAmount is null).
   * When invalid, the error field should identify the specific failing condition.
   */
  it("returns the correct validation result based on coupon conditions", async () => {
    await fc.assert(
      fc.asyncProperty(couponRecordArb, orderSubtotalArb, async (coupon, subtotal) => {
        vi.clearAllMocks();
        mockedPrisma.coupon.findUnique.mockResolvedValue(coupon);

        const result = await validateCoupon(coupon.code, subtotal);
        const expected = expectedResult(coupon, subtotal);

        expect(result.valid).toBe(expected.valid);

        if (!expected.valid) {
          expect(result.error).toBe(expected.error);
          expect(result.discountAmount).toBeUndefined();
        } else {
          expect(result.error).toBeUndefined();
          expect(result.discountAmount).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: website-improvements, Property 10: Coupon discount calculation round-trip
describe("Property 10: Coupon discount calculation round-trip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 4.6, 4.8**
   *
   * For any valid coupon and order subtotal, the discount amount should equal
   * Math.round(subtotal * discountValue / 100) for percentage coupons,
   * or discountValue for fixed coupons.
   */
  it("discount equals the expected calculation for valid coupons", async () => {
    // Generate coupons that are guaranteed to be valid
    const validCouponArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 10 }),
      code: fc.string({ minLength: 1, maxLength: 20 }),
      discountType: discountTypeArb,
      discountValue: fc.integer({ min: 1, max: 100 }),
      minOrderAmount: fc.constant(null as number | null),
      maxUses: fc.constant(null as number | null),
      currentUses: fc.constant(0),
      expiresAt: fc.constant(null as Date | null),
      isActive: fc.constant(true),
      createdAt: fc.constant(new Date()),
    });

    await fc.assert(
      fc.asyncProperty(validCouponArb, orderSubtotalArb, async (coupon, subtotal) => {
        vi.clearAllMocks();
        mockedPrisma.coupon.findUnique.mockResolvedValue(coupon);

        const result = await validateCoupon(coupon.code, subtotal);

        expect(result.valid).toBe(true);
        expect(result.discountAmount).toBeDefined();

        const expectedDiscount = calculateDiscount(
          coupon.discountType,
          coupon.discountValue,
          subtotal
        );
        expect(result.discountAmount).toBe(expectedDiscount);

        // Verify the calculation formula directly
        if (coupon.discountType === "PERCENTAGE") {
          expect(result.discountAmount).toBe(
            Math.round((subtotal * coupon.discountValue) / 100)
          );
        } else {
          expect(result.discountAmount).toBe(coupon.discountValue);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: website-improvements, Property 11: No coupon means no discount
describe("Property 11: No coupon means no discount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 4.7**
   *
   * When no coupon is found (prisma returns null), validateCoupon should
   * return { valid: false, error: "NOT_FOUND" }.
   */
  it("returns NOT_FOUND when coupon does not exist", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }),
        orderSubtotalArb,
        async (code, subtotal) => {
          vi.clearAllMocks();
          mockedPrisma.coupon.findUnique.mockResolvedValue(null);

          const result = await validateCoupon(code, subtotal);

          expect(result.valid).toBe(false);
          expect(result.error).toBe("NOT_FOUND");
          expect(result.discountAmount).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
