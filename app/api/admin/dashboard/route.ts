import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/adminAuth";

/** Start of the current and previous calendar month in IST, as UTC instants. */
function monthBoundsIST(now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const startOfMonth = new Date(Date.UTC(y, m, 1, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
  const startOfPrevMonth = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
  return { startOfMonth, startOfPrevMonth };
}

const PAID_STATUSES: OrderStatus[] = [
  "VERIFIED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURN_RECEIVED",
  "EXCHANGE_DISPATCHED",
  "EXCHANGE_COMPLETED",
];

const customerSelect = { fullName: true, phone: true, email: true, city: true } as const;
const rowSelect = {
  orderCode: true,
  amount: true,
  status: true,
  paymentMethod: true,
  createdAt: true,
  updatedAt: true,
  address: { select: customerSelect },
  items: { select: { quantity: true } },
} as const;

/** GET /api/admin/dashboard */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { startOfMonth, startOfPrevMonth } = monthBoundsIST();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [grouped, thisMonth, prevMonth, thisMonthOrders, shippedWeek, awaiting, returns, recent] = await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({
        where: { status: { in: PAID_STATUSES }, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { status: { in: PAID_STATUSES }, createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.count({ where: { status: "SHIPPED", updatedAt: { gte: sevenDaysAgo } } }),
      prisma.order.findMany({
        where: { status: "UNDER_VERIFICATION" },
        orderBy: { createdAt: "asc" },
        take: 8,
        select: rowSelect,
      }),
      prisma.order.findMany({
        where: { status: { in: ["RETURN_REQUESTED", "RETURN_RECEIVED", "EXCHANGE_DISPATCHED"] } },
        orderBy: { updatedAt: "asc" },
        take: 8,
        select: rowSelect,
      }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: rowSelect }),
    ]);

    const counts: Record<string, number> = {};
    for (const g of grouped) counts[g.status] = g._count._all;

    const shape = (rows: typeof awaiting) =>
      rows.map(({ items, ...o }) => ({ ...o, itemCount: items.reduce((n, i) => n + i.quantity, 0) }));

    return NextResponse.json({
      counts,
      revenue: {
        thisMonth: thisMonth._sum.amount ?? 0,
        prevMonth: prevMonth._sum.amount ?? 0,
        paidOrdersThisMonth: thisMonth._count._all,
        ordersThisMonth: thisMonthOrders,
      },
      shippedLast7Days: shippedWeek,
      awaiting: shape(awaiting),
      returns: shape(returns),
      recent: shape(recent),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
