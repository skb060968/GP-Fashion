import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/security/session";
import { couponSchema, formatZodErrors } from "@/lib/validation/schemas";
import { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (!token) return false;
  return validateSession(token);
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "All";

    const where: Record<string, unknown> = {};

    if (search) {
      where.code = { contains: search };
    }

    if (status === "Active") {
      where.isActive = true;
    } else if (status === "Inactive") {
      where.isActive = false;
    }

    const [coupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.coupon.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return NextResponse.json({
      coupons,
      totalCount,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
    });
  } catch (error) {
    console.error("ADMIN COUPONS LIST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = couponSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", fieldErrors: formatZodErrors(result.error) },
        { status: 400 }
      );
    }

    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = result.data;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount ?? null,
        maxUses: maxUses ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
        currentUses: 0,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }

    console.error("ADMIN COUPON CREATE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
