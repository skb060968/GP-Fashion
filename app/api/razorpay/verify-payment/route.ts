import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { sendMail } from "@/lib/mailer";
import {
  orderPlacedEmailAdmin,
  orderPlacedEmailCustomer,
} from "@/lib/emails/orderPlaced";
import {
  razorpayVerifyPaymentSchema,
  formatZodErrors,
} from "@/lib/validation/schemas";
import { createRateLimiter } from "@/lib/security/rateLimiter";
import { verifyRazorpaySignature } from "@/lib/razorpay/verifySignature";
import { validateCoupon, applyCoupon } from "@/lib/services/couponService";

const rateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 10,
});

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
    const parsed = razorpayVerifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: formatZodErrors(parsed.error) },
        { status: 400 }
      );
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderData,
    } = parsed.data;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 }
      );
    }

    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      secret
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      );
    }

    // --- Order creation (mirrors /api/orders logic) ---
    const { items, address, amount: subtotal, couponCode } = orderData;

    // Coupon validation
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

    // Generate orderCode
    const year = new Date().getFullYear();
    const orderCode = await generateOrderCode(year);

    // Create order with Razorpay payment details
    const createdOrder = await prisma.order.create({
      data: {
        orderCode,
        amount: finalAmount,
        discount,
        paymentMethod: PaymentMethod.RAZORPAY,
        status: OrderStatus.UNDER_VERIFICATION,
        couponCode: validCoupon ? couponCode : null,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,

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

    // Increment coupon usage
    if (validCoupon && couponCode) {
      await applyCoupon(couponCode);
    }

    // Re-fetch order with relations
    const order = await prisma.order.findUnique({
      where: { id: createdOrder.id },
      include: {
        address: true,
        items: true,
        history: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found after creation" },
        { status: 500 }
      );
    }

    // Return immediately
    const response = NextResponse.json(
      { success: true, orderId: order.orderCode },
      { status: 201 }
    );

    // Send emails after response
    after(async () => {
      try {
        // Admin notification
        if (process.env.ADMIN_EMAIL) {
          await sendMail({
            to: process.env.ADMIN_EMAIL,
            subject: "🛒 New order placed",
            html: orderPlacedEmailAdmin({
              orderCode: order.orderCode,
              amount: order.amount,
              discount: order.discount,
              status: order.status,
              createdAt: order.createdAt,
              paymentMethod: order.paymentMethod,
              customer: {
                fullName: order.address!.fullName,
                phone: order.address!.phone,
                email: order.address!.email ?? "",
                addressLine1: order.address!.addressLine1,
                addressLine2: order.address!.addressLine2 ?? "",
                city: order.address!.city,
                state: order.address!.state,
                pincode: order.address!.pincode,
              },
              items: order.items.map((item) => ({
                name: item.name,
                size: item.size,
                price: item.price,
                quantity: item.quantity,
                coverThumbnail: item.coverThumbnail ?? "",
              })),
            }),
          });
        }

        // Customer notification
        if (order.address?.email) {
          await sendMail({
            to: order.address.email,
            subject: "✅ Your order has been placed",
            html: orderPlacedEmailCustomer({
              orderCode: order.orderCode,
              amount: order.amount,
              discount: order.discount,
              status: order.status,
              createdAt: order.createdAt,
              paymentMethod: order.paymentMethod,
              customer: {
                fullName: order.address.fullName,
                phone: order.address.phone,
                email: order.address.email,
                addressLine1: order.address.addressLine1,
                addressLine2: order.address.addressLine2 ?? "",
                city: order.address.city,
                state: order.address.state,
                pincode: order.address.pincode,
              },
              items: order.items.map((item) => ({
                name: item.name,
                size: item.size,
                price: item.price,
                quantity: item.quantity,
                coverThumbnail: item.coverThumbnail ?? "",
              })),
            }),
          });
        }
      } catch (error) {
        console.error("ORDER_EMAIL_FAILED:", error);
      }
    });

    return response;
  } catch (error) {
    console.error("RAZORPAY_VERIFY_PAYMENT_ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
