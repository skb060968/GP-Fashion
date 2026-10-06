"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Check } from "lucide-react"
import { formatRupees } from "@/lib/money"
import CheckoutSteps from "@/components/checkout/CheckoutSteps"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"
import { paymentLabel, statusLabel } from "@/lib/orders/labels"
import { useUser } from "@/context/UserContext"

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
  items: { id: string; name: string; size: string; price: number; quantity: number; coverThumbnail: string }[]
}

function SuccessContent() {
  const sp = useSearchParams()
  const orderId = sp.get("orderId")
  const token = sp.get("t")
  const { user } = useUser()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    // The payment step stashes the created order so we can render at once.
    try {
      const cached = sessionStorage.getItem(`order:${orderId}`)
      if (cached) {
        setOrder(JSON.parse(cached))
        setLoading(false)
        return
      }
    } catch {
      /* fall through to fetch */
    }
    fetch(`/api/orders/${orderId}${token ? `?t=${token}` : ""}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [orderId, token])

  const invoiceHref = (code: string) => `/api/invoice/${code}.pdf${token ? `?t=${token}` : ""}`

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading title="Checkout" />
          <div className="mt-10 lg:mt-12">
            <CheckoutSteps current="confirmation" />
          </div>

          {loading ? (
            <p className="mt-20 text-center font-jost text-black/60" aria-live="polite">
              Loading your confirmation…
            </p>
          ) : !order ? (
            <FadeIn className="mx-auto mt-20 max-w-md text-center">
              <h2 className="font-cinzel text-xl font-bold uppercase tracking-[0.15em]">
                Order not found
              </h2>
              <p className="mt-4 font-jost text-black/65">
                We couldn&apos;t find that order. If you have just placed it, please check the confirmation email.
              </p>
              <Link href="/track-order" className="btn-outline-dark mt-8">
                Track an order
              </Link>
            </FadeIn>
          ) : (
            <div className="mx-auto mt-14 max-w-3xl lg:mt-16">
              {/* Headline */}
              <FadeIn className="flex flex-col items-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-white">
                  <Check className="h-7 w-7" strokeWidth={2} aria-hidden />
                </span>
                <h2 className="mt-6 font-cinzel text-2xl font-bold uppercase tracking-[0.15em] sm:text-3xl">
                  Thank you, {order.address?.fullName.split(" ")[0] ?? "there"}
                </h2>
                <p className="mt-4 max-w-lg font-jost text-base leading-relaxed text-black/65 sm:text-lg">
                  Your order has been placed. We are verifying your UPI payment and will email you at{" "}
                  <span className="text-black">{order.address?.email}</span> once it is confirmed.
                </p>
                <p className="mt-6 font-jost text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                  Order number
                </p>
                <p className="mt-1 font-cinzel text-3xl font-bold tracking-[0.2em]">{order.orderCode}</p>
              </FadeIn>

              {/* Details */}
              <FadeIn delay={120} className="mt-12">
                <div className="card-elevated p-6 sm:p-8">
                  <dl className="grid grid-cols-1 gap-6 font-jost text-sm sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50">Status</dt>
                      <dd className="mt-1 text-black">{statusLabel(order.status)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50">Payment</dt>
                      <dd className="mt-1 text-black">{paymentLabel(order.paymentMethod)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50">Placed on</dt>
                      <dd className="mt-1 text-black">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </dd>
                    </div>
                  </dl>

                  <ul className="mt-8 divide-y divide-black/10 border-t border-black/10">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-4 py-4">
                        <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-stone-200">
                          <Image src={item.coverThumbnail} alt={item.name} fill sizes="3.5rem" className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 font-jost">
                          <p className="truncate text-sm font-semibold">{item.name}</p>
                          <p className="mt-0.5 text-xs text-black/60">
                            Size {item.size} · Qty {item.quantity}
                          </p>
                        </div>
                        <p className="font-jost text-sm tabular-nums">{formatRupees(item.price * item.quantity)}</p>
                      </li>
                    ))}
                  </ul>

                  <dl className="mt-6 space-y-2 border-t border-black/10 pt-6 font-jost text-sm text-black/70">
                    {order.discount > 0 && (
                      <>
                        <div className="flex justify-between">
                          <dt>Subtotal</dt>
                          <dd className="tabular-nums text-black">{formatRupees(order.amount + order.discount)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt>
                          <dd className="tabular-nums text-black">−{formatRupees(order.discount)}</dd>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between pt-2 text-base font-semibold text-black">
                      <dt className="uppercase tracking-[0.15em]">Total</dt>
                      <dd className="tabular-nums">{formatRupees(order.amount)}</dd>
                    </div>
                  </dl>

                  {order.address && (
                    <div className="mt-8 border-t border-black/10 pt-6 font-jost text-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/50">Shipping to</p>
                      <address className="mt-2 not-italic leading-relaxed text-black/75">
                        <span className="text-black">{order.address.fullName}</span>
                        <br />
                        {order.address.addressLine1}
                        {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}
                        <br />
                        {order.address.city}, {order.address.state} {order.address.pincode}
                      </address>
                    </div>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={200} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a href={invoiceHref(order.orderCode)} download className="btn-outline-dark w-full sm:w-auto">
                  Download invoice
                </a>
                <Link href={user ? "/account" : "/track-order"} className="btn-outline-dark w-full sm:w-auto">
                  {user ? "My orders" : "Track order"}
                </Link>
                <Link href="/" className="btn-solid-dark w-full sm:w-auto">
                  Continue browsing
                </Link>
              </FadeIn>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <p className="py-40 text-center font-jost text-black/60" aria-live="polite">
          Loading…
        </p>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
