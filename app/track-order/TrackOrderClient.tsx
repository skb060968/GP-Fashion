"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, Check } from "lucide-react"
import { formatRupees } from "@/lib/money"
import { TRACKING_STEPS, trackingProgress, statusLabel } from "@/lib/orders/labels"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"
import Field from "@/components/checkout/Field"
import ReturnTimeline from "@/components/ReturnTimeline"

interface OrderItem {
  id: string
  name: string
  size: string
  price: number
  quantity: number
}

interface OrderData {
  orderCode: string
  status: string
  amount: number
  createdAt: string
  /** Proves this lookup matched the phone number; unlocks the invoice. */
  accessToken: string
  history: { status: string }[]
  items: OrderItem[]
}

export default function TrackOrderClient() {
  const [orderCode, setOrderCode] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [order, setOrder] = useState<OrderData | null>(null)

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setOrder(null)
    setLoading(true)
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderCode: orderCode.trim(), phone: phone.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(
          res.status === 429
            ? "Too many attempts. Please wait a few minutes and try again."
            : data?.error || "We couldn't find an order with those details."
        )
        return
      }
      setOrder(await res.json())
    } catch {
      setError("Something went wrong. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const historyStatuses = order?.history.map((h) => h.status) ?? []
  const progress = order ? trackingProgress(order.status, historyStatuses) : -1
  const failed = order ? progress === -1 : false

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading
            title="Track Order"
            meta="Enter your order number and the mobile number used at checkout"
          />

          {/* Lookup form */}
          <FadeIn className="mx-auto mt-14 max-w-xl lg:mt-16">
            <form onSubmit={handleTrack} noValidate className="card-elevated p-6 sm:p-8">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Order number"
                  name="orderCode"
                  inputMode="numeric"
                  placeholder="e.g. 26040"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  required
                />
                <Field
                  label="Mobile number"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 font-jost text-sm text-red-800"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  <p>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !orderCode.trim() || !phone.trim()}
                className="btn-solid-dark mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white"
              >
                {loading ? "Checking…" : "Track order"}
              </button>
            </form>
          </FadeIn>

          {/* Result */}
          {order && (
            <FadeIn className="mx-auto mt-12 max-w-3xl">
              <div className="card-elevated p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-jost text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                      Order number
                    </p>
                    <p className="mt-1 font-cinzel text-2xl font-bold tracking-[0.2em]">{order.orderCode}</p>
                  </div>
                  <div className="font-jost text-sm text-black/60 sm:text-right">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-8 border-t border-black/10 pt-8">
                  {failed ? (
                    <div className="rounded-lg border border-black/10 p-5 font-jost">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Status</p>
                      <p className="mt-1 text-base font-semibold">{statusLabel(order.status)}</p>
                      <p className="mt-2 text-sm text-black/65">
                        If you have questions about this order, please{" "}
                        <Link href="/contact" className="underline underline-offset-4 hover:text-black">
                          get in touch
                        </Link>
                        .
                      </p>
                    </div>
                  ) : (
                    <ol className="grid grid-cols-5 gap-1 sm:gap-2" aria-label="Order progress">
                      {TRACKING_STEPS.map((step, i) => {
                        const done = i <= progress
                        const current = i === progress
                        return (
                          <li key={step.key} className="relative flex flex-col items-center text-center">
                            {i > 0 && (
                              <span
                                aria-hidden
                                className={`absolute right-1/2 top-4 h-px w-full ${i <= progress ? "bg-black" : "bg-black/15"}`}
                              />
                            )}
                            <span
                              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border font-jost text-xs font-semibold ${
                                done ? "border-black bg-black text-white" : "border-black/20 bg-white text-black/40"
                              } ${current ? "ring-4 ring-black/10" : ""}`}
                              aria-hidden
                            >
                              {done && !current ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
                            </span>
                            <span
                              className={`mt-3 font-jost text-[11px] leading-tight sm:text-xs ${
                                current ? "font-semibold text-black" : done ? "text-black/70" : "text-black/40"
                              }`}
                              aria-current={current ? "step" : undefined}
                            >
                              {step.label}
                            </span>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>

                <ReturnTimeline status={order.status} history={historyStatuses} />

                {/* Items */}
                <ul className="mt-8 divide-y divide-black/10 border-t border-black/10">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-4 py-4 font-jost text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.name}</p>
                        <p className="mt-0.5 text-xs text-black/60">
                          Size {item.size} · Qty {item.quantity}
                        </p>
                      </div>
                      <p className="tabular-nums">{formatRupees(item.price * item.quantity)}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-baseline justify-between border-t border-black/10 pt-6 font-jost">
                  <span className="text-sm font-semibold uppercase tracking-[0.15em]">Total</span>
                  <span className="text-lg font-semibold tabular-nums">{formatRupees(order.amount)}</span>
                </div>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href={`/invoice/${order.orderCode}?t=${order.accessToken}`} className="btn-outline-dark w-full sm:w-auto">
                    View invoice
                  </Link>
                  <a href={`/api/invoice/${order.orderCode}.pdf?t=${order.accessToken}`} download className="btn-solid-dark w-full sm:w-auto">
                    Download PDF
                  </a>
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </section>
    </div>
  )
}
