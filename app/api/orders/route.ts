import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { sendOrderPlacedEmails } from "@/lib/emails/sendOrderPlaced";
import { createOrderSchema, formatZodErrors } from "@/lib/validation/schemas";
import { createRateLimiter } from "@/lib/security/rateLimiter";
import { validateCoupon, applyCoupon } from "@/lib/services/couponService";

const orderRateLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, maxRequests: 10 });

// Helper: generate short order codes like 26001, 26002, etc.
async function generateOrderCode(year: number) {
  const yearSuffix = year.toString().slice(-2);

  const lastOrder = await prisma.order.findFirst({
    where: { orderCode: { startsWith: yearSuffix } },
    orderBy: { createdAt: "desc" },
  });

  const lastSeq = lastOrder
    ? parseInt(lastOrder.orderCode.slice(2)) // after YY
    : 0;

  const nextSeq = (lastSeq + 1).toString().padStart(3, "0");

  return `${yearSuffix}${nextSeq}`;
}

export async function POST(req: Request) {
  try {
    // Rate limiting check
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const rateResult = orderRateLimiter.check(clientIp);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(rateResult.retryAfterSeconds) } }
      );
    }

    // Check payload size before parsing
    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > 102400) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    const body = await req.json();

    // Validate with Zod schema
    const result = createOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { errors: formatZodErrors(result.error) },
        { status: 400 }
      );
    }

    const { items, address, amount: subtotal, paymentMethod, couponCode } = result.data;

    // 🎟️ Coupon validation — server calculates discount on original subtotal
    let discount = 0;
    let validCoupon = false;
    if (couponCode) {
      const couponResult = await validateCoupon(couponCode, subtotal);
      if (!couponResult.valid) {
        return NextResponse.json(
          { error: couponResult.error, code: couponResult.error },
          { status: 400 }
        );
      }
      discount = couponResult.discountAmount!;
      validCoupon = true;
    }

    // Final amount = subtotal minus discount
    const finalAmount = subtotal - discount;

    // 🔑 Generate orderCode
    const year = new Date().getFullYear();
    const orderCode = await generateOrderCode(year);

    // 1️⃣ Create order with relations + initial history, returning the
    //    relations in the same call so no second round trip is needed.
    const order = await prisma.order.create({
      include: { address: true, items: true },
      data: {
        orderCode, // 👈 new short code
        amount: finalAmount,
        discount,
        paymentMethod: paymentMethod as PaymentMethod, // Zod validates the enum value
        status: OrderStatus.UNDER_VERIFICATION,
        couponCode: validCoupon ? couponCode : null,

        address: {
          create: {
            fullName: address.fullName,
            phone: address.phone,
            email: address.email || null,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2 || null,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
        },

        items: {
          create: items.map((item) => ({
            name: item.name,
            slug: item.slug,
            size: item.size,
            price: item.price,
            quantity: item.quantity ?? 1,
            coverThumbnail: item.coverThumbnail,
          })),
        },

        history: {
          create: {
            status: OrderStatus.UNDER_VERIFICATION,
            changedAt: new Date(),
          },
        },
      },
    });

    // ✅ Return immediately to frontend. The full order is included so the
    //    confirmation page can render without fetching it again.
    const response = NextResponse.json(
      { success: true, orderId: order.orderCode, order },
      { status: 201 }
    );

    // 🔔 Coupon bookkeeping + emails after the response (kept alive by `after`)
    after(async () => {
      if (validCoupon && couponCode) {
        try {
          await applyCoupon(couponCode);
        } catch (error) {
          console.error("COUPON_APPLY_FAILED:", error);
        }
      }
      await sendOrderPlacedEmails(order);
    });

    return response;
  } catch (error) {
    console.error("ORDER_CREATE_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}