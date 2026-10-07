

import type { OrderEmailData } from "@/lib/types/OrderEmailData"
import { paymentLabel } from "@/lib/orders/labels"
import { formatRupees } from "@/lib/money"
import {
  address,
  button,
  escapeHtml,
  heading,
  itemsTable,
  orderFacts,
  orderNumber,
  paragraph,
  shell,
  siteUrl,
} from "./layout"

const firstName = (full: string) => full.trim().split(/\s+/)[0] || "there"

export function orderPlacedEmailCustomer(order: OrderEmailData) {
  const site = siteUrl()
  const isManual = order.paymentMethod === "UPI_MANUAL"

  const intro = isManual
    ? `We have received your order and are verifying your UPI payment. You will hear from us again as soon as it is confirmed, usually within one working day.`
    : `We have received your order and your payment is confirmed. We will let you know as soon as it is on its way.`

  const html = shell({
    preheader: `Order ${order.orderCode} received. Total ${formatRupees(order.amount)}.`,
    sections: [
      heading(`Thank you, ${firstName(order.customer.fullName)}`) + paragraph(intro),
      orderNumber(order.orderCode),
      orderFacts(order),
      itemsTable(order),
      address(order.customer),
      button("Track your order", `${site}/track-order`, "outline"),
    ],
    footerNote: `Questions about your order? Reply to this email or write to us at <a href="mailto:piyushbholla@gmail.com" style="color:#666666;">piyushbholla@gmail.com</a>, quoting order ${escapeHtml(order.orderCode)}.`,
  })

  return {
    subject: `Order ${order.orderCode} received`,
    html,
  }
}

export function orderPlacedEmailAdmin(order: OrderEmailData) {
  const site = siteUrl()
  const isManual = order.paymentMethod === "UPI_MANUAL"

  const action = isManual
    ? paragraph(
        `Customer has confirmed a UPI payment of <strong>${formatRupees(order.amount)}</strong>. Check the account for a matching credit, then verify or reject the order in the admin.`
      )
    : paragraph(`Paid via ${escapeHtml(paymentLabel(order.paymentMethod))}. Ready to process.`)

  const html = shell({
    preheader: `New order ${order.orderCode} from ${order.customer.fullName}. ${formatRupees(order.amount)}.`,
    sections: [
      heading("New order") + action,
      orderNumber(order.orderCode),
      orderFacts(order),
      itemsTable(order),
      address(order.customer, "Customer"),
      button("Open in admin", `${site}/admin/orders/${order.orderCode}`),
    ],
  })

  return {
    subject: `New order ${order.orderCode} · ${formatRupees(order.amount)} · ${order.customer.fullName}`,
    html,
  }
}
