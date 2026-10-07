import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/security/adminAuth";
import { ordersToCsv } from "@/lib/admin/csvExport";
import { buildOrderWhere, parseOrderFilters } from "@/lib/admin/orderQuery";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(req.url);
    const where = buildOrderWhere(parseOrderFilters(searchParams));

    const orders = await prisma.order.findMany({
      where,
      include: { address: true, items: true },
      orderBy: { createdAt: "desc" },
    });

    const csv = ordersToCsv(orders);
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error("ADMIN CSV EXPORT ERROR:", error);
    return NextResponse.json({ error: "Failed to export orders" }, { status: 500 });
  }
}
