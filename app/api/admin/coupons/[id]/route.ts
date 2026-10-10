import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminMutation } from "@/lib/security/adminAuth";
import { couponSchema, formatZodErrors } from "@/lib/validation/schemas";
import { couponState } from "@/lib/admin/couponStatus";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    return NextResponse.json({ coupon: { ...coupon, state: couponState(coupon) } });
  } catch (error) {
    console.error("ADMIN COUPON FETCH ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdminMutation(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);

    const result = couponSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", fieldErrors: formatZodErrors(result.error) }, { status: 400 });
    }

    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive } = result.data;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount ?? null,
        maxUses: maxUses ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        ...(isActive === undefined ? {} : { isActive }),
      },
    });

    return NextResponse.json({ coupon: { ...coupon, state: couponState(coupon) } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "A coupon with this code already exists", fieldErrors: { code: "Already in use" } }, { status: 409 });
      }
      if (error.code === "P2025") return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    console.error("ADMIN COUPON UPDATE ERROR:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const denied = await requireAdminMutation(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }
    console.error("ADMIN COUPON DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
