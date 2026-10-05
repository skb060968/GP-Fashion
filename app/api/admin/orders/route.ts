import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/adminAuth";
import { buildOrderWhere, parseOrderFilters } from "@/lib/admin/orderQuery";

const PAGE_SIZE = 20;

/**
 * GET /api/admin/orders?page&search&status&paymentMethod&from&to
 * Returns a lean page of orders plus per-status counts for the current
 * search/payment/date filters (so the status chips show live numbers).
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const filters = parseOrderFilters(searchParams);
    const where = buildOrderWhere(filters);
    // Counts ignore the status filter so every chip stays populated.
    const whereNoStatus = buildOrderWhere({ ...filters, status: null });

    const [rows, totalCount, grouped] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          orderCode: true,
          amount: true,
          discount: true,
          couponCode: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          updatedAt: true,
          address: { select: { fullName: true, phone: true, email: true, city: true } },
          items: { select: { quantity: true } },
        },
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({ by: ["status"], where: whereNoStatus, _count: { _all: true } }),
    ]);

    const orders = rows.map(({ items, ...o }) => ({
      ...o,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
    }));

    const counts: Record<string, number> = {};
    let all = 0;
    for (const g of grouped) {
      counts[g.status] = g._count._all;
      all += g._count._all;
    }
    counts.All = all;

    return NextResponse.json({
      orders,
      counts,
      totalCount,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(totalCount / PAGE_SIZE),
    });
  } catch (error) {
    console.error("ADMIN ORDERS LIST ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
