import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { validateCoupon } from "@/lib/services/couponService";
import { createRateLimiter } from "@/lib/security/rateLimiter";

// Stops someone brute-forcing coupon codes from the checkout page.
const limiter = createRateLimiter({ windowMs: 10 * 60 * 1000, maxRequests: 30 });

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().int().nonnegative(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const rate = limiter.check(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing or invalid 'code' (string) and 'subtotal' (number)" }, { status: 400 });
  }

  const result = await validateCoupon(parsed.data.code, parsed.data.subtotal);
  return NextResponse.json(result);
}
