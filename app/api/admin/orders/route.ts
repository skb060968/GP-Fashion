import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/security/session";
import { OrderStatus } from "@prisma/client";

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
      where.orderCode = { contains: search };
    }

    if (status && status !== "All" && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { address: true, items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return NextResponse.json({
      orders,
      totalCount,
      page,
      pageSize: PAGE_SIZE,
      totalPages,
    });
  } catch (error) {
    console.error("ADMIN ORDERS LIST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
