// lib/emails/orderStatusEmailCustomer.ts
// Sent to the customer whenever the admin changes an order's status.

import type { OrderEmailData } from "@/lib/types/OrderEmailData"
import { formatRupees } from "@/lib/money"
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
        subject: `Payment confirmed for order ${code}`,
        title: `Payment confirmed`,
        body: `Thank you, ${name}. Your payment of ${formatRupees(order.amount)} has been verified and your order is now with our atelier. We will write again when it is being prepared.`,
        cta: track,
      }
    case "PROCESSING":
      return {
        subject: `Order ${code} is being prepared`,
        title: `In the making`,
        body: `${name}, your pieces are being prepared. Each garment is finished by hand, so please allow a little time. You will receive a note the moment your order ships.`,
        cta: track,
      }
    case "SHIPPED":
      return {
        subject: `Order ${code} has shipped`,
        title: `On its way`,
        body: `Good news, ${name}. Your order has left us and is on its way to the address below.`,
        cta: track,
      }
    case "DELIVERED":
      return {
        subject: `Order ${code} delivered`,
        title: `Delivered`,
        body: `${name}, your order has been delivered. We hope you love wearing it. If anything is not as expected, reply to this email and we will put it right.`,
        cta: { text: "Visit the collection", href: site },
      }
    case "REJECTED":
      return {
        subject: `Action needed on order ${code}`,
        title: `We could not verify your payment`,
        body: `${name}, we were unable to match a UPI payment to this order. If you have paid, reply to this email with the transaction reference and we will sort it out straight away. If not, you can place the order again at any time.`,
        cta: { text: "Contact us", href: `${site}/contact` },
      }
    case "CANCELLED":
      return {
        subject: `Order ${code} cancelled`,
        title: `Order cancelled`,
        body: `${name}, your order has been cancelled. If a payment was made, a refund will follow and we will confirm it by email. If this was unexpected, please get in touch.`,
        cta: { text: "Contact us", href: `${site}/contact` },
      }
    case "REFUNDED":
      return {
        subject: `Refund issued for order ${code}`,
        title: `Refund issued`,
        body: `${name}, a refund of ${formatRupees(order.amount)} has been issued for this order. Depending on your bank it may take a few working days to appear.`,
      }
    case "UNDER_VERIFICATION":
    default:
      return {
        subject: `Update on order ${code}`,
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
