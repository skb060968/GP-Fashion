// lib/emails/orderStatusEmailCustomer.ts
// Sent to the customer whenever the admin changes an order's status.

import type { OrderEmailData } from "@/lib/types/OrderEmailData"
import { formatRupees } from "@/lib/money"
import { statusEmailSubject } from "@/lib/orders/labels"
import { address, button, heading, itemsTable, orderFacts, orderNumber, paragraph, shell, siteUrl } from "./layout"

const firstName = (full: string) => full.trim().split(/\s+/)[0] || "there"

type Copy = { subject: string; title: string; body: string; cta?: { text: string; href: string } }

function copyFor(order: OrderEmailData, site: string): Copy {
  const code = order.orderCode
  const name = firstName(order.customer.fullName)
  const track = { text: "Track your order", href: `${site}/track-order` }

  switch (order.status) {
    case "VERIFIED":
      return {
        subject: statusEmailSubject("VERIFIED", code),
        title: `Payment confirmed`,
        body: `Thank you, ${name}. Your payment of ${formatRupees(order.amount)} has been verified and your order is now with our atelier. We will write again when it is being prepared.`,
        cta: track,
      }
    case "PROCESSING":
      return {
        subject: statusEmailSubject("PROCESSING", code),
        title: `In the making`,
        body: `${name}, your pieces are being prepared. Each garment is finished by hand, so please allow a little time. You will receive a note the moment your order ships.`,
        cta: track,
      }
    case "SHIPPED":
      return {
        subject: statusEmailSubject("SHIPPED", code),
        title: `On its way`,
        body: `Good news, ${name}. Your order has left us and is on its way to the address below.`,
        cta: track,
      }
    case "DELIVERED":
      return {
        subject: statusEmailSubject("DELIVERED", code),
        title: `Delivered`,
        body: `${name}, your order has been delivered. We hope you love wearing it. If anything is not as expected, reply to this email and we will put it right.`,
        cta: { text: "Visit the collection", href: site },
      }
    case "RETURN_REQUESTED":
      return {
        subject: statusEmailSubject("RETURN_REQUESTED", code),
        title: `Return opened`,
        body: `${name}, we have recorded your return or exchange request for this order. Please follow the return instructions agreed with the studio. We will write again when the pieces reach us.`,
        cta: { text: "Contact the studio", href: `${site}/contact` },
      }
    case "RETURN_RECEIVED":
      return {
        subject: statusEmailSubject("RETURN_RECEIVED", code),
        title: `Return received`,
        body: `${name}, your returned pieces have reached the studio. We are inspecting them and will confirm the agreed refund or replacement shortly.`,
        cta: track,
      }
    case "EXCHANGE_DISPATCHED":
      return {
        subject: statusEmailSubject("EXCHANGE_DISPATCHED", code),
        title: `Your replacement is on its way`,
        body: `${name}, the replacement pieces for your exchange have left the studio and are on their way to you.`,
        cta: track,
      }
    case "EXCHANGE_COMPLETED":
      return {
        subject: statusEmailSubject("EXCHANGE_COMPLETED", code),
        title: `Exchange completed`,
        body: `${name}, your replacement has been delivered and the exchange is now complete. We hope the new piece is just right.`,
        cta: { text: "Visit the collection", href: site },
      }
    case "REJECTED":
      return {
        subject: statusEmailSubject("REJECTED", code),
        title: `We could not verify your payment`,
        body: `${name}, we were unable to match a UPI payment to this order. If you have paid, reply to this email with the transaction reference and we will sort it out straight away. If not, you can place the order again at any time.`,
        cta: { text: "Contact us", href: `${site}/contact` },
      }
    case "CANCELLED":
      return {
        subject: statusEmailSubject("CANCELLED", code),
        title: `Order cancelled`,
        body: `${name}, your order has been cancelled. If a payment was made, a refund will follow and we will confirm it by email. If this was unexpected, please get in touch.`,
        cta: { text: "Contact us", href: `${site}/contact` },
      }
    case "REFUNDED":
      return {
        subject: statusEmailSubject("REFUNDED", code),
        title: `Refund issued`,
        body: `${name}, a refund of ${formatRupees(order.amount)} has been issued for this order. Depending on your bank it may take a few working days to appear.`,
      }
    case "UNDER_VERIFICATION":
    default:
      return {
        subject: statusEmailSubject(order.status, code),
        title: `Order update`,
        body: `${name}, there is an update on your order. The current status is shown below.`,
        cta: track,
      }
  }
}

export function orderStatusEmailCustomer(order: OrderEmailData) {
  const site = siteUrl()
  const c = copyFor(order, site)

  const sections = [
    heading(c.title) + paragraph(c.body),
    orderNumber(order.orderCode),
    orderFacts(order),
    itemsTable(order),
    address(order.customer),
  ]
  if (c.cta) sections.push(button(c.cta.text, c.cta.href, "outline"))

  return {
    subject: c.subject,
    html: shell({
      preheader: `${c.title}. Order ${order.orderCode}.`,
      sections,
      footerNote: `Questions? Reply to this email quoting order ${order.orderCode}.`,
    }),
  }
}
