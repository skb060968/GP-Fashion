import { describe, it, expect, beforeAll } from "vitest";
import * as fc from "fast-check";
import { orderAccessToken, isValidOrderToken } from "@/lib/security/orderAccess";

beforeAll(() => {
  process.env.ORDER_ACCESS_SECRET ??= "test-secret";
});

describe("order access tokens", () => {
  it("is deterministic for the same code and accepted by the validator", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{5,8}$/), (code) => {
        const t = orderAccessToken(code);
        expect(t).toHaveLength(32);
        expect(orderAccessToken(code)).toBe(t);
        expect(isValidOrderToken(code, t)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("a token for one order never opens another", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\d{5,8}$/), fc.stringMatching(/^\d{5,8}$/), (a, b) => {
        fc.pre(a !== b);
        expect(isValidOrderToken(b, orderAccessToken(a))).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects missing, short, and tampered tokens", () => {
    const t = orderAccessToken("26001");
    expect(isValidOrderToken("26001", null)).toBe(false);
    expect(isValidOrderToken("26001", undefined)).toBe(false);
    expect(isValidOrderToken("26001", "")).toBe(false);
    expect(isValidOrderToken("26001", t.slice(0, 31))).toBe(false);
    const flipped = (t[0] === "a" ? "b" : "a") + t.slice(1);
    expect(isValidOrderToken("26001", flipped)).toBe(false);
  });
});
