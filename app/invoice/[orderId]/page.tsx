"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Download, Printer } from "lucide-react"
import { formatRupees } from "@/lib/money"
import { formatDateDDMMYYYY } from "@/lib/date"
import { paymentLabel, statusLabel } from "@/lib/orders/labels"
import { content } from "@/lib/data"

type Order = {
  orderCode: string
  amount: number
  discount: number
  couponCode: string | null
  paymentMethod: string
  status: string
  createdAt: string
  address: {
    fullName: string
    phone: string
    email: string | null
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    pincode: string
  } | null
  items: { id: string; name: string; size: string; price: number; quantity: number }[]
}

export default function InvoicePage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const { contact } = content

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [orderId])

  // Document title becomes the default PDF filename when printing.
  useEffect(() => {
    if (order) document.title = `Invoice-${order.orderCode}`
    return () => {
      document.title = "Piyush Bholla"
    }
  }, [order])

  if (loading) {
    return (
      <p className="py-40 text-center font-jost text-black/60" aria-live="polite">
        Loading invoice…
      </p>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <h1 className="font-cinzel text-xl font-bold uppercase tracking-[0.15em]">Invoice not found</h1>
        <p className="mt-4 font-jost text-black/65">We couldn&apos;t find an order with that number.</p>
        <Link href="/track-order" className="btn-outline-dark mt-8">
          Track an order
        </Link>
      </div>
    )
  }

  const subtotal = order.amount + order.discount

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20 print:p-0">
        <div className="container-max">
          {/* Actions (screen only) */}
          <div className="mx-auto mb-8 flex max-w-3xl flex-col items-center gap-4 print:hidden sm:flex-row sm:justify-between">
            <Link
              href="/track-order"
              className="font-jost text-sm text-black/60 underline-offset-4 transition-colors hover:text-black hover:underline"
            >
              ← Track order
            </Link>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <button type="button" onClick={() => window.print()} className="btn-outline-dark">
                <Printer className="mr-3 h-4 w-4" strokeWidth={1.5} aria-hidden />
                Print
              </button>
              <a href={`/api/invoice/${order.orderCode}.pdf`} download className="btn-solid-dark">
                <Download className="mr-3 h-4 w-4" strokeWidth={1.5} aria-hidden />
                Download PDF
              </a>
            </div>
          </div>

          {/* Invoice sheet */}
          <article className="invoice-card mx-auto max-w-3xl border border-black/10 bg-white p-8 sm:p-12 print:border-0 print:p-0">
            {/* Header */}
            <header className="flex flex-col items-start justify-between gap-8 border-b border-black/10 pb-8 sm:flex-row sm:items-center">
              <div className="flex flex-col items-center">
                <Image
                  src="/images/brand/logo-mark.png"
                  alt=""
                  width={213}
                  height={320}
                  priority
                  className="h-14 w-auto"
                />
                <span className="mt-2 whitespace-nowrap font-cinzel text-base font-bold uppercase tracking-[0.25em]">
                  Piyush Bholla
                </span>
              </div>
              <div className="font-jost sm:text-right">
                <h1 className="font-cinzel text-2xl font-bold uppercase tracking-[0.25em]">Invoice</h1>
                <p className="mt-2 text-sm text-black/60">
                  No. <span className="font-semibold text-black">{order.orderCode}</span>
                </p>
                <p className="text-sm text-black/60">Date {formatDateDDMMYYYY(order.createdAt)}</p>
              </div>
            </header>

            {/* Parties */}
            <div className="grid grid-cols-1 gap-8 py-8 font-jost text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Billed to</p>
                {order.address && (
                  <address className="mt-3 not-italic leading-relaxed text-black/75">
                    <span className="font-semibold text-black">{order.address.fullName}</span>
                    <br />
                    {order.address.addressLine1}
                    {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}
                    <br />
                    {order.address.city}, {order.address.state} {order.address.pincode}
                    <br />
                    <span className="text-black/60">{order.address.phone}</span>
                    {order.address.email && (
                      <>
                        <br />
                        <span className="text-black/60">{order.address.email}</span>
                      </>
                    )}
                  </address>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">From</p>
                <address className="mt-3 not-italic leading-relaxed text-black/75">
                  <span className="font-semibold text-black">Piyush Bholla Label</span>
                  <br />
                  {contact.location}
                  <br />
                  <span className="text-black/60">{contact.email}</span>
                  <br />
                  <span className="text-black/60">{contact.phone}</span>
                </address>
                <dl className="mt-5 space-y-1 text-black/75">
                  <div className="flex justify-between gap-6 sm:justify-end">
                    <dt className="text-black/50">Payment</dt>
                    <dd>{paymentLabel(order.paymentMethod)}</dd>
                  </div>
                  <div className="flex justify-between gap-6 sm:justify-end">
                    <dt className="text-black/50">Status</dt>
                    <dd>{statusLabel(order.status)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Items */}
            <table className="w-full border-t border-black/10 font-jost text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.15em] text-black/50">
                  <th scope="col" className="py-3 pr-4 font-semibold">Item</th>
                  <th scope="col" className="py-3 pr-4 font-semibold">Size</th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">Price</th>
                  <th scope="col" className="py-3 pr-4 text-right font-semibold">Qty</th>
                  <th scope="col" className="py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 border-y border-black/10">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 font-semibold">{item.name}</td>
                    <td className="py-3 pr-4 text-black/70">{item.size}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-black/70">{formatRupees(item.price)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-black/70">{item.quantity}</td>
                    <td className="py-3 text-right tabular-nums">{formatRupees(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <dl className="ml-auto mt-6 max-w-xs space-y-2 font-jost text-sm text-black/70">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-black">{formatRupees(subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                  <dd className="tabular-nums text-black">−{formatRupees(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="text-black/50">Complimentary</dd>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-base font-semibold text-black">
                <dt className="uppercase tracking-[0.15em]">Total</dt>
                <dd className="tabular-nums">{formatRupees(order.amount)}</dd>
              </div>
            </dl>

            {/* Footer */}
            <footer className="mt-12 border-t border-black/10 pt-6 text-center font-jost text-xs leading-relaxed text-black/50">
              <p>Thank you for shopping with Piyush Bholla.</p>
              <p>This invoice is generated electronically and does not require a signature.</p>
            </footer>
          </article>
        </div>
      </section>
    </div>
  )
}
