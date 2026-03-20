import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  createOrderSchema,
  addressSchema,
  updateStatusSchema,
  formatZodErrors,
} from "../schemas";

// The OrderStatus enum values from Prisma schema
const ORDER_STATUS_VALUES = [
  "UNDER_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

const VALID_SIZES = ["S", "M", "L", "XL"] as const;
const VALID_PAYMENT_METHODS = ["UPI_MANUAL", "COD", "RAZORPAY"] as const;

// --- Generators ---

const digitArb = fc.integer({ min: 0, max: 9 }).map(String);

const validPhoneArb = fc
  .tuple(
    fc.constantFrom(6, 7, 8, 9),
    fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
  )
  .map(([first, rest]) => String(first) + rest.join(""));

const validPincodeArb = fc
  .array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 6 })
  .map((digits) => digits.join(""));

const nonEmptyStringArb = (minLen: number, maxLen: number) =>
  fc.string({ minLength: minLen, maxLength: maxLen }).filter((s) => s.trim().length >= minLen);

const validAddressArb = fc.record({
  fullName: nonEmptyStringArb(2, 100),
  phone: validPhoneArb,
  email: fc.constantFrom("", "test@example.com", "user@domain.co"),
  addressLine1: nonEmptyStringArb(5, 200),
  addressLine2: fc.constantFrom("", "Apt 4B", "Floor 2"),
  city: nonEmptyStringArb(1, 50),
  state: nonEmptyStringArb(1, 50),
  pincode: validPincodeArb,
});

const validOrderItemArb = fc.record({
  slug: nonEmptyStringArb(1, 50),
  name: nonEmptyStringArb(1, 100),
  size: fc.constantFrom(...VALID_SIZES),
  price: fc.integer({ min: 1, max: 1000000 }),
  quantity: fc.integer({ min: 1, max: 10 }),
  coverThumbnail: nonEmptyStringArb(1, 200),
});

const validOrderPayloadArb = fc.record({
  items: fc.array(validOrderItemArb, { minLength: 1, maxLength: 5 }),
  address: validAddressArb,
  amount: fc.integer({ min: 1, max: 10000000 }),
  paymentMethod: fc.constantFrom(...VALID_PAYMENT_METHODS),
});

// --- Property Tests ---

describe("Validation Schemas - Property Tests", () => {
  // Feature: website-improvements, Property 1: Order payload validation accepts valid and rejects invalid
  describe("Property 1: Order payload validation accepts valid and rejects invalid", () => {
    /**
     * Validates: Requirements 1.1, 1.2
     */
    it("accepts any valid order payload", () => {
      fc.assert(
        fc.property(validOrderPayloadArb, (payload) => {
          const result = createOrderSchema.safeParse(payload);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with empty items array", () => {
      fc.assert(
        fc.property(validAddressArb, fc.constantFrom(...VALID_PAYMENT_METHODS), (address, pm) => {
          const payload = {
            items: [],
            address,
            amount: 100,
            paymentMethod: pm,
          };
          const result = createOrderSchema.safeParse(payload);
          expect(result.success).toBe(false);
          if (!result.success) {
            const errors = formatZodErrors(result.error);
            expect(Object.keys(errors).length).toBeGreaterThan(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with non-positive amount", () => {
      fc.assert(
        fc.property(
          fc.array(validOrderItemArb, { minLength: 1, maxLength: 3 }),
          validAddressArb,
          fc.constantFrom(...VALID_PAYMENT_METHODS),
          fc.integer({ min: -1000000, max: 0 }),
          (items, address, pm, amount) => {
            const payload = { items, address, amount, paymentMethod: pm };
            const result = createOrderSchema.safeParse(payload);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects payloads with invalid paymentMethod", () => {
      fc.assert(
        fc.property(
          fc.array(validOrderItemArb, { minLength: 1, maxLength: 3 }),
          validAddressArb,
          fc.string().filter((s) => !VALID_PAYMENT_METHODS.includes(s as any)),
          fc.integer({ min: 1, max: 10000000 }),
          (items, address, pm, amount) => {
            const payload = { items, address, amount, paymentMethod: pm };
            const result = createOrderSchema.safeParse(payload);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: website-improvements, Property 2: Phone number validation matches Indian mobile pattern
  describe("Property 2: Phone number validation matches Indian mobile pattern", () => {
    /**
     * Validates: Requirements 1.3, 8.2
     */
    const phoneRegex = /^[6-9]\d{9}$/;

    it("accepts valid 10-digit Indian mobile numbers starting with 6-9", () => {
      fc.assert(
        fc.property(validPhoneArb, (phone) => {
          expect(phoneRegex.test(phone)).toBe(true);
          const result = addressSchema.shape.phone.safeParse(phone);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects strings that don't match the Indian mobile pattern", () => {
      const invalidPhoneArb = fc.oneof(
        // Too short (1-9 digits)
        fc
          .array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 9 })
          .map((d) => d.join("")),
        // Too long (11-15 digits)
        fc
          .array(fc.integer({ min: 0, max: 9 }), { minLength: 11, maxLength: 15 })
          .map((d) => d.join("")),
        // Starts with 0-5 (exactly 10 digits)
        fc
          .tuple(
            fc.constantFrom(0, 1, 2, 3, 4, 5),
            fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
          )
          .map(([f, r]) => String(f) + r.join("")),
        // Contains non-digit characters
        fc.string({ minLength: 1, maxLength: 15 }).filter((s) => /[^0-9]/.test(s))
      );

      fc.assert(
        fc.property(invalidPhoneArb, (phone) => {
          const result = addressSchema.shape.phone.safeParse(phone);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: website-improvements, Property 3: Pincode validation matches 6-digit pattern
  describe("Property 3: Pincode validation matches 6-digit pattern", () => {
    /**
     * Validates: Requirements 1.5, 8.6
     */
    const pincodeRegex = /^\d{6}$/;

    it("accepts valid 6-digit pincodes", () => {
      fc.assert(
        fc.property(validPincodeArb, (pincode) => {
          expect(pincodeRegex.test(pincode)).toBe(true);
          const result = addressSchema.shape.pincode.safeParse(pincode);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects strings that don't match the 6-digit pattern", () => {
      const invalidPincodeArb = fc.oneof(
        // Too short (1-5 digits)
        fc
          .array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 5 })
          .map((d) => d.join("")),
        // Too long (7-12 digits)
        fc
          .array(fc.integer({ min: 0, max: 9 }), { minLength: 7, maxLength: 12 })
          .map((d) => d.join("")),
        // Contains non-digit characters (length 6)
        fc.string({ minLength: 6, maxLength: 6 }).filter((s) => /[^0-9]/.test(s))
      );

      fc.assert(
        fc.property(invalidPincodeArb, (pincode) => {
          const result = addressSchema.shape.pincode.safeParse(pincode);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: website-improvements, Property 4: Status update validation accepts only valid enum members
  describe("Property 4: Status update validation accepts only valid enum members", () => {
    /**
     * Validates: Requirements 1.6
     */
    it("accepts all valid OrderStatus enum values", () => {
      fc.assert(
        fc.property(fc.constantFrom(...ORDER_STATUS_VALUES), (status) => {
          const result = updateStatusSchema.safeParse({ status });
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects strings that are not valid OrderStatus enum members", () => {
      const invalidStatusArb = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => !(ORDER_STATUS_VALUES as readonly string[]).includes(s));

      fc.assert(
        fc.property(invalidStatusArb, (status) => {
          const result = updateStatusSchema.safeParse({ status });
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
