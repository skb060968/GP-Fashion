

import type { Address, BillingAddress, Order, OrderItem } from "@prisma/client"
import { sendMail } from "@/lib/mailer"
import { isSnapshot } from "@/lib/measurements/fields"
import type { OrderEmailData } from "@/lib/types/OrderEmailData"
import { orderPlacedEmailAdmin, orderPlacedEmailCustomer } from "./orderPlaced"

type OrderWithRelations = Order & { address: Address | null; billingAddress?: BillingAddress | null; items: OrderItem[] }

export const emailBilling = (b: { fullName: string; addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string } | null | undefined) =>
  b ? { fullName: b.fullName, addressLine1: b.addressLine1, addressLine2: b.addressLine2 ?? undefined, city: b.city, state: b.state, pincode: b.pincode } : null

export function toOrderEmailData(order: OrderWithRelations): OrderEmailData | null {
  if (!order.address) return null
  const a = order.address
  return {
    orderCode: order.orderCode,
    amount: order.amount,
    discount: order.discount,
    gst: order.cgst + order.sgst + order.igst,
    invoiceNumber: order.invoiceNumber,
    paymentReference: order.paymentReference,
    status: order.status,
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
    customer: {
      fullName: a.fullName,
      phone: a.phone,
      email: a.email ?? undefined,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? undefined,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    },
    billing: emailBilling(order.billingAddress),
    items: order.items.map((i) => ({
      name: i.name,
      size: i.size,
      color: i.color ?? null,
      price: i.price,
      quantity: i.quantity,
      coverThumbnail: i.coverThumbnail ?? "",
      madeToMeasureFor: isSnapshot(i.measurements) ? i.measurements.name : null,
    })),
  }
}

export async function sendOrderPlacedEmails(order: OrderWithRelations) {
  const data = toOrderEmailData(order)
  if (!data) return

  const jobs: Promise<unknown>[] = []

  if (process.env.ADMIN_EMAIL) {
    const { subject, html } = orderPlacedEmailAdmin(data)
    jobs.push(sendMail({ to: process.env.ADMIN_EMAIL, subject, html }))
  }
  if (data.customer.email) {
    const { subject, html } = orderPlacedEmailCustomer(data)
    jobs.push(sendMail({ to: data.customer.email, subject, html }))
  }

  const results = await Promise.allSettled(jobs)
  for (const r of results) {
    if (r.status === "rejected") console.error("ORDER_EMAIL_FAILED:", r.reason)
  }
}
