// lib/emails/sendOrderPlaced.ts
// One place that turns a freshly created order into the admin + customer emails.

import type { Address, Order, OrderItem } from "@prisma/client"
import { sendMail } from "@/lib/mailer"
import type { OrderEmailData } from "@/lib/types/OrderEmailData"
import { orderPlacedEmailAdmin, orderPlacedEmailCustomer } from "./orderPlaced"

type OrderWithRelations = Order & { address: Address | null; items: OrderItem[] }

export function toOrderEmailData(order: OrderWithRelations): OrderEmailData | null {
  if (!order.address) return null
  const a = order.address
  return {
    orderCode: order.orderCode,
    amount: order.amount,
    discount: order.discount,
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
    items: order.items.map((i) => ({
      name: i.name,
      size: i.size,
      price: i.price,
      quantity: i.quantity,
      coverThumbnail: i.coverThumbnail ?? "",
    })),
  }
}

/** Sends admin + customer "order placed" emails. Never throws; logs failures. */
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
