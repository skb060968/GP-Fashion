import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/security/session";
import { ordersToCsv } from "@/lib/admin/csvExport";

const VALID_STATUSES = [
  "UNDER_VERIFICATION", "VERIFIED", "REJECTED", "PROCESSING",
  "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED",
] as const;

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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "All";

    const where: Record<string, unknown> = {};

    if (search) {
      where.orderCode = { contains: search };
    }

    if (
      status &&
      status !== "All" &&
      (VALID_STATUSES as readonly string[]).includes(status)
    ) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: { address: true, items: true },
      orderBy: { createdAt: "desc" },
    });

    const csv = ordersToCsv(orders);

    const today = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${today}.csv"`,
      },
    });
  } catch (error) {
    console.error("ADMIN CSV EXPORT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to export orders" },
      { status: 500 }
    );
  }
}
