import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { canReadOrder } from "@/lib/security/orderAccess";

export async function GET(req: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params;

    const order = await prisma.order.findUnique({
      where: { orderCode: orderId },
      include: { address: true, items: true },
    });

    if (!order || !(await canReadOrder(req, order.orderCode, { userId: order.userId, email: order.address?.email ?? null }))) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("FETCH ORDER ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}
