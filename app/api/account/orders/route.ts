import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/security/userSession"
import { isSnapshot } from "@/lib/measurements/fields"
import { returnableOrder } from "@/lib/orders/returnableOrder"
import { describeReturn } from "@/lib/orders/returns"

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId: user.id }, { address: { is: { email: { equals: user.email, mode: "insensitive" } } } }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      orderCode: true,
      amount: true,
      status: true,
      paymentMethod: true,
      createdAt: true,
      invoiceNumber: true,
      creditNotes: { select: { number: true }, orderBy: { date: "asc" } },
      returnRequests: { select: { createdAt: true, reason: true, resolution: true, note: true, items: true }, orderBy: { createdAt: "asc" } },
      history: { select: { status: true, changedAt: true }, orderBy: { changedAt: "asc" } },
      items: {
        select: {
          id: true,
          name: true,
          size: true,
          color: true,
          quantity: true,
          price: true,
          coverThumbnail: true,
          slug: true,
          measurements: true,
          measurementsConfirmedAt: true,
        },
      },
    },
  })

  return NextResponse.json({
    orders: orders.map(({ returnRequests, ...o }) => ({
      ...o,
      history: o.history.map((h) => ({ status: h.status })),
      returnable: returnableOrder(o),
      lastReturn: returnRequests.length ? { ...describeReturn(returnRequests[returnRequests.length - 1]), createdAt: returnRequests[returnRequests.length - 1].createdAt } : null,
      items: o.items.map(({ measurements, measurementsConfirmedAt, ...it }) => ({
        ...it,
        madeToMeasureFor: isSnapshot(measurements) ? measurements.name : null,
        measurementsConfirmed: !!measurementsConfirmedAt,
      })),
    })),
  })
}
