import { NextResponse, after, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { sendOrderPlacedEmails } from "@/lib/emails/sendOrderPlaced";
import { createOrderSchema, formatZodErrors } from "@/lib/validation/schemas";
import { getUserFromRequest } from "@/lib/security/userSession";
import { createRateLimiter } from "@/lib/security/rateLimiter";
import { orderAccessToken } from "@/lib/security/orderAccess";
import { validateCoupon, applyCoupon } from "@/lib/services/couponService";

const orderRateLimiter = createRateLimiter({ windowMs: 5 * 60 * 1000, maxRequests: 10 });

async function generateOrderCode(year: number) {
  const yearSuffix = year.toString().slice(-2);

  const lastOrder = await prisma.order.findFirst({
    where: { orderCode: { startsWith: yearSuffix } },
    orderBy: { createdAt: "desc" },
  });

  const lastSeq = lastOrder
    ? parseInt(lastOrder.orderCode.slice(2))
    : 0;

  const nextSeq = (lastSeq + 1).toString().padStart(3, "0");

  return `${yearSuffix}${nextSeq}`;
}

export async function POST(req: Request) {
  try {

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

    const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
    if (contentLength > 102400) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    const body = await req.json();

    const result = createOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { errors: formatZodErrors(result.error) },
        { status: 400 }
      );
    }

    const { items, address, amount: subtotal, paymentMethod, couponCode } = result.data;

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

    const finalAmount = subtotal - discount;

    const year = new Date().getFullYear();
    const orderCode = await generateOrderCode(year);

    const sessionUser = await getUserFromRequest(req as NextRequest).catch(() => null);

    const order = await prisma.order.create({
      include: { address: true, items: true },
      data: {
        orderCode,
        userId: sessionUser?.id ?? null,
        amount: finalAmount,
        discount,
        paymentMethod: paymentMethod as PaymentMethod,
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

    const response = NextResponse.json(
      { success: true, orderId: order.orderCode, accessToken: orderAccessToken(order.orderCode), order },
      { status: 201 }
    );

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
