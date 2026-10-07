import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/adminAuth";
import { couponSchema, formatZodErrors } from "@/lib/validation/schemas";
import { couponState, couponStateWhere, type CouponState } from "@/lib/admin/couponStatus";

const PAGE_SIZE = 20;
const STATES: CouponState[] = ["ACTIVE", "INACTIVE", "EXPIRED", "EXHAUSTED"];

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const search = (searchParams.get("search") || "").trim();
    const stateRaw = searchParams.get("state") || "";
    const state = (STATES as string[]).includes(stateRaw) ? (stateRaw as CouponState) : null;
    const now = new Date();

    const base: Prisma.CouponWhereInput = search ? { code: { contains: search, mode: "insensitive" } } : {};

    const exhaustedCandidates = await prisma.coupon.findMany({
      where: { ...base, ...couponStateWhere("EXHAUSTED", now) },
      select: { id: true, maxUses: true, currentUses: true },
    });
    const exhaustedIds = exhaustedCandidates.filter((c) => c.maxUses !== null && c.currentUses >= c.maxUses).map((c) => c.id);

    let where: Prisma.CouponWhereInput = base;
    if (state === "EXHAUSTED") where = { id: { in: exhaustedIds } };
    else if (state === "ACTIVE") where = { ...base, ...couponStateWhere("ACTIVE", now), id: { notIn: exhaustedIds } };
    else if (state) where = { ...base, ...couponStateWhere(state, now) };

    const [rows, totalCount, allRows] = await Promise.all([
      prisma.coupon.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      prisma.coupon.count({ where }),
      prisma.coupon.findMany({
        where: base,
        select: { isActive: true, expiresAt: true, maxUses: true, currentUses: true, discountType: true, discountValue: true, minOrderAmount: true },
      }),
    ]);

    const counts: Record<string, number> = { All: allRows.length, ACTIVE: 0, INACTIVE: 0, EXPIRED: 0, EXHAUSTED: 0 };
    for (const c of allRows) counts[couponState(c, now)]++;

    return NextResponse.json({
      coupons: rows.map((c) => ({ ...c, state: couponState(c, now) })),
      counts,
      totalCount,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
    });
  } catch (error) {
    console.error("ADMIN COUPONS LIST ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => null);
    const result = couponSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", fieldErrors: formatZodErrors(result.error) }, { status: 400 });
    }

    const { code, discountType, discountValue, minOrderAmount, maxUses, expiresAt, isActive } = result.data;

    const coupon = await prisma.coupon.create({
      data: {
        code,
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount ?? null,
        maxUses: maxUses ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive ?? true,
        currentUses: 0,
      },
    });

    return NextResponse.json({ coupon: { ...coupon, state: couponState(coupon) } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A coupon with this code already exists", fieldErrors: { code: "Already in use" } }, { status: 409 });
    }
    console.error("ADMIN COUPON CREATE ERROR:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
