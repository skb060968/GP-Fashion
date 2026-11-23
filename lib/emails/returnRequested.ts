import type { OrderEmailData } from "@/lib/types/OrderEmailData"
import { address, button, escapeHtml, heading, orderNumber, paragraph, shell, siteUrl } from "./layout"

export function returnRequestedEmailAdmin(order: OrderEmailData) {
  const r = order.returnRequest
  const site = siteUrl()
  const details = r
    ? paragraph(
        `<strong>${escapeHtml(r.reason)}</strong>. ${escapeHtml(r.resolution)}.<br>${r.items.map(escapeHtml).join("<br>")}${r.note ? `<br><br>Note: ${escapeHtml(r.note)}` : ""}`
      ) + (r.photos ? paragraph("The customer has been asked to send photos by WhatsApp or by replying to their email.", { muted: true }) : "")
    : ""
  return {
    subject: `Return requested for order ${order.orderCode} · ${order.customer.fullName}`,
    html: shell({
      preheader: `${order.customer.fullName} asked to return pieces from order ${order.orderCode}.`,
      sections: [
        heading("Return requested") + paragraph("The customer requested this from their order page. Reply to confirm how they should send the piece back.") + details,
        orderNumber(order.orderCode),
        address(order.customer, "Customer"),
        button("Open in admin", `${site}/admin/orders/${order.orderCode}`),
      ],
    }),
  }
}
