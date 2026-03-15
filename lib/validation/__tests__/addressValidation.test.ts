import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { validateAddress } from "../addressValidation";

// --- Generators ---

const validPhoneArb = fc
  .tuple(
    fc.constantFrom(6, 7, 8, 9),
    fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
  )
  .map(([first, rest]) => String(first) + rest.join(""));

const validPincodeArb = fc
  .array(fc.integer({ min: 0, max: 9 }), { minLength: 6, maxLength: 6 })
  .map((digits) => digits.join(""));

const validEmailArb = fc.constantFrom(
  "",
  "test@example.com",
  "user@domain.co",
  "hello@shop.in",
  "a@b.com"
);

const safeStringArb = (minLen: number, maxLen: number) =>
  fc
    .string({ minLength: minLen, maxLength: maxLen })
    .filter((s) => s.trim().length >= minLen);

const validAddressArb = fc.record({
  fullName: safeStringArb(2, 100),
  phone: validPhoneArb,
  email: validEmailArb,
  addressLine1: safeStringArb(5, 200),
  addressLine2: fc.constantFrom("", "Apt 4B", "Floor 2"),
  city: safeStringArb(1, 50),
  state: safeStringArb(1, 50),
  pincode: validPincodeArb,
});

// Feature: website-improvements, Property 18: Address validation accepts valid and rejects invalid addresses
describe("Property 18: Address validation accepts valid and rejects invalid addresses", () => {
  /**
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
   */

  it("accepts any valid address", () => {
    fc.assert(
      fc.property(validAddressArb, (address) => {
        const result = validateAddress(address);
        expect(result.valid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects addresses with fullName shorter than 2 characters", () => {
    fc.assert(
      fc.property(validAddressArb, (address) => {
        const invalid = { ...address, fullName: "A" };
        const result = validateAddress(invalid);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveProperty("fullName");
      }),
      { numRuns: 100 }
    );
  });

  it("rejects addresses with invalid phone number", () => {
    const invalidPhoneArb = fc.oneof(
      // Too short
      fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 9 }).map((d) => d.join("")),
      // Too long
      fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 11, maxLength: 15 }).map((d) => d.join("")),
      // Starts with 0-5
      fc
        .tuple(
          fc.constantFrom(0, 1, 2, 3, 4, 5),
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 9, maxLength: 9 })
        )
        .map(([f, r]) => String(f) + r.join(""))
    );

    fc.assert(
      fc.property(validAddressArb, invalidPhoneArb, (address, phone) => {
        const invalid = { ...address, phone };
        const result = validateAddress(invalid);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveProperty("phone");
      }),
      { numRuns: 100 }
    );
  });

  it("rejects addresses with addressLine1 shorter than 5 characters", () => {
    fc.assert(
      fc.property(validAddressArb, (address) => {
        const invalid = { ...address, addressLine1: "Ab" };
        const result = validateAddress(invalid);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveProperty("addressLine1");
      }),
      { numRuns: 100 }
    );
  });

  it("rejects addresses with empty city", () => {
    fc.assert(
      fc.property(validAddressArb, (address) => {
        const invalid = { ...address, city: "" };
        const result = validateAddress(invalid);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveProperty("city");
      }),
      { numRuns: 100 }
    );
  });

  it("rejects addresses with empty state", () => {
    fc.assert(
      fc.property(validAddressArb, (address) => {
        const invalid = { ...address, state: "" };
        const result = validateAddress(invalid);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveProperty("state");
      }),
      { numRuns: 100 }
    );
  });

  it("rejects addresses with invalid pincode", () => {
    const invalidPincodeArb = fc.oneof(
      // Too short
      fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 5 }).map((d) => d.join("")),
      // Too long
      fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 7, maxLength: 12 }).map((d) => d.join("")),
      // Non-digit characters
      fc.string({ minLength: 6, maxLength: 6 }).filter((s) => /[^0-9]/.test(s))
    );

    fc.assert(
      fc.property(validAddressArb, invalidPincodeArb, (address, pincode) => {
        const invalid = { ...address, pincode };
        const result = validateAddress(invalid);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveProperty("pincode");
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: website-improvements, Property 19: Valid address persistence round-trip
describe("Property 19: Valid address persistence round-trip", () => {
  /**
   * Validates: Requirements 8.8
   */

  it("valid address survives JSON serialize/parse round-trip and remains valid", () => {
    fc.assert(
      fc.property(validAddressArb, (address) => {
        // Simulate localStorage round-trip
        const serialized = JSON.stringify(address);
        const deserialized = JSON.parse(serialized);

        const originalResult = validateAddress(address);
        const roundTripResult = validateAddress(deserialized);

        expect(originalResult.valid).toBe(true);
        expect(roundTripResult.valid).toBe(true);
        expect(deserialized).toEqual(address);
      }),
      { numRuns: 100 }
    );
  });
});
