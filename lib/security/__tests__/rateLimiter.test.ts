import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { createRateLimiter } from "../rateLimiter";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the max limit", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(true);
    expect(limiter.check("ip1").allowed).toBe(true);
  });

  it("blocks requests exceeding the max limit", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 2 });

    limiter.check("ip1");
    limiter.check("ip1");
    const result = limiter.check("ip1");

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("returns retryAfterSeconds reflecting remaining window time", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

    limiter.check("ip1");
    vi.advanceTimersByTime(30_000); // advance 30s

    const result = limiter.check("ip1");
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(30);
  });

  it("resets after the time window passes (lazy cleanup)", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

    limiter.check("ip1");
    expect(limiter.check("ip1").allowed).toBe(false);

    vi.advanceTimersByTime(60_000); // window expires

    expect(limiter.check("ip1").allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

    limiter.check("ip1");
    expect(limiter.check("ip1").allowed).toBe(false);
    expect(limiter.check("ip2").allowed).toBe(true);
  });

  it("reset() clears the entry for a key", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });

    limiter.check("ip1");
    expect(limiter.check("ip1").allowed).toBe(false);

    limiter.reset("ip1");
    expect(limiter.check("ip1").allowed).toBe(true);
  });

  it("reset() on unknown key is a no-op", () => {
    const limiter = createRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    limiter.reset("unknown"); // should not throw
  });
});

// Feature: website-improvements, Property 5: Rate limiter enforces request cap within time window
describe("Property 5: Rate limiter enforces request cap within time window", () => {
  /**
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4
   */
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows exactly maxRequests calls then blocks the next one with retryAfterSeconds > 0", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (maxRequests, key) => {
          const limiter = createRateLimiter({ windowMs: 60_000, maxRequests });

          // First maxRequests calls should all be allowed
          for (let i = 0; i < maxRequests; i++) {
            const result = limiter.check(key);
            expect(result.allowed).toBe(true);
          }

          // The (maxRequests + 1)th call should be blocked
          const blocked = limiter.check(key);
          expect(blocked.allowed).toBe(false);
          expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
