import { NextResponse } from "next/server";
import { getRazorpayInstance } from "@/lib/razorpay/client";
import {
  razorpayCreateOrderSchema,
  formatZodErrors,
} from "@/lib/validation/schemas";
import { createRateLimiter } from "@/lib/security/rateLimiter";

const rateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
});

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rateResult = rateLimiter.check(clientIp);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(rateResult.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json();

    // Validate request body
    const result = razorpayCreateOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { errors: formatZodErrors(result.error) },
        { status: 400 }
      );
    }

    const { amount } = result.data;

    // Check env vars
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    });

    return NextResponse.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("RAZORPAY_CREATE_ORDER_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
