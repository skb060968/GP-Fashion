import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminMutation } from "@/lib/security/adminAuth";
import { couponState } from "@/lib/admin/couponStatus";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminMutation(req);
  if (denied) return denied;

  try {
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });

    return NextResponse.json({ coupon: { ...updated, state: couponState(updated) } });
  } catch (error) {
    console.error("ADMIN COUPON TOGGLE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to toggle coupon" },
      { status: 500 }
    );
  }
}
