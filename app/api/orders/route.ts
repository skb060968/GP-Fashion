import { NextResponse, after, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import {
  KINDS_FOR_CATEGORY,
  MTM_SIZE,
  type MeasurementSnapshot,
  type MeasurementValues,
  type PersonKind,
} from "@/lib/measurements/fields";
import { sendOrderPlacedEmails } from "@/lib/emails/sendOrderPlaced";
import { createOrderSchema, formatZodErrors } from "@/lib/validation/schemas";
import { getUserFromRequest } from "@/lib/security/userSession";
import { createRateLimiter } from "@/lib/security/rateLimiter";
import { orderAccessToken } from "@/lib/security/orderAccess";
import { validateCoupon, applyCoupon } from "@/lib/services/couponService";
import { getProduct } from "@/lib/data/categories";

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

    const { items: submittedItems, address, amount: submittedSubtotal, paymentMethod, couponCode, acceptMadeToMeasure } = result.data;

    const sessionUser = await getUserFromRequest(req as NextRequest).catch(() => null);

    const profileIds = [...new Set(submittedItems.map((i) => i.profileId).filter((id): id is string => !!id))];
    if (profileIds.length > 0) {
      if (!sessionUser) {
        return NextResponse.json({ error: "Please sign in to order made to measure." }, { status: 401 });
      }
      if (!acceptMadeToMeasure) {
        return NextResponse.json({ error: "Please accept the made-to-measure terms before placing your order." }, { status: 400 });
      }
    }
    const profiles = profileIds.length
      ? await prisma.measurementProfile.findMany({ where: { id: { in: profileIds }, userId: sessionUser!.id } })
      : [];
    const profileById = new Map(profiles.map((p) => [p.id, p]));

    const items = [];
    for (const submitted of submittedItems) {
      const product = getProduct(submitted.slug);
      if (!product) {
        return NextResponse.json({ error: "A product or selected size is no longer available" }, { status: 400 });
      }

      let measurements: MeasurementSnapshot | null = null;
      if (submitted.profileId) {
        const profile = profileById.get(submitted.profileId);
        if (!profile) {
          return NextResponse.json({ error: "Saved measurements in your bag were deleted. Remove the item and add it again." }, { status: 400 });
        }
        const kind = profile.kind as PersonKind;
        if (submitted.size !== MTM_SIZE || !KINDS_FOR_CATEGORY[product.category].includes(kind)) {
          return NextResponse.json({ error: `Those measurements can't be used for ${product.name}.` }, { status: 400 });
        }
        measurements = {
          profileId: profile.id,
          name: profile.name,
          kind,
          values: profile.values as MeasurementValues,
          notes: profile.notes,
          savedAt: profile.updatedAt.toISOString(),
        };
      } else if (!product.sizes.includes(submitted.size)) {
        return NextResponse.json({ error: "A product or selected size is no longer available" }, { status: 400 });
      }

      let color: string | null = null;
      let coverThumbnail = product.coverThumbnail;
      if (product.colors.length > 0) {
        const chosen = submitted.color
          ? product.colors.find((c) => c.name === submitted.color)
          : product.colors.find((c) => c.slug === product.defaultColor) ?? product.colors[0];
        if (!chosen) {
          return NextResponse.json({ error: "A selected colour is no longer available" }, { status: 400 });
        }
        color = chosen.name;
        coverThumbnail = chosen.coverThumbnail;
      }

      items.push({
        slug: product.slug,
        name: product.name,
        size: submitted.size,
        color,
        price: product.price,
        quantity: submitted.quantity,
        coverThumbnail,
        measurements,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (subtotal !== submittedSubtotal) {
      return NextResponse.json({ error: "Your bag has changed. Please review it before payment." }, { status: 400 });
    }

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
            color: item.color,
            price: item.price,
            quantity: item.quantity ?? 1,
            coverThumbnail: item.coverThumbnail,
            ...(item.measurements ? { measurements: item.measurements as unknown as Prisma.InputJsonValue } : {}),
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
