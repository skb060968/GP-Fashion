

import type { OrderEmailData } from "@/lib/types/OrderEmailData"
import { paymentLabel } from "@/lib/orders/labels"
import { formatRupees } from "@/lib/money"
import { MTM_LEAD_TIME } from "@/lib/measurements/fields"
import {
  address,
  BRAND,
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

  const mtm = order.items.some((i) => i.madeToMeasureFor)
    ? paragraph(
        `Your made-to-measure ${order.items.filter((i) => i.madeToMeasureFor).length === 1 ? "piece is" : "pieces are"} cut from the measurements saved in your account. We will call or WhatsApp you to confirm them before cutting, and ${order.items.filter((i) => i.madeToMeasureFor).length === 1 ? "it is" : "they are"} ready in ${MTM_LEAD_TIME} after that. Made-to-measure pieces cannot be returned, exchanged or altered.`
      )
    : ""

  const html = shell({
    preheader: `Order ${order.orderCode} received. Total ${formatRupees(order.amount)}.`,
    sections: [
      heading(`Thank you, ${firstName(order.customer.fullName)}`) + paragraph(intro) + mtm,
      orderNumber(order.orderCode),
      orderFacts(order),
      itemsTable(order),
      address(order.customer),
      button("Track your order", `${site}/track-order`, "outline"),
    ],
    footerNote: `Questions about your order? Reply to this email or write to us at <a href="mailto:${BRAND.email}" style="color:#666666;">${escapeHtml(BRAND.email)}</a>, quoting order ${escapeHtml(order.orderCode)}.`,
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

  const mtmCount = order.items.filter((i) => i.madeToMeasureFor).length
  const mtm = mtmCount
    ? paragraph(
        `<strong>Made to measure:</strong> ${mtmCount} ${mtmCount === 1 ? "item" : "items"}. Confirm the measurements with the customer from the order page before starting processing.`
      )
    : ""

  const html = shell({
    preheader: `New order ${order.orderCode} from ${order.customer.fullName}. ${formatRupees(order.amount)}.`,
    sections: [
      heading("New order") + action + mtm,
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
