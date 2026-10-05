"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"
import { formatRupees } from "@/lib/money"
import { paymentLabel, statusLabel, TRACKING_STEPS, trackingProgress } from "@/lib/orders/labels"
import EmptyState from "@/components/EmptyState"
import FadeIn from "@/components/FadeIn"

type Order = {
  orderCode: string
  amount: number
  status: string
  paymentMethod: string
  createdAt: string
  items: { id: string; name: string; size: string; quantity: number; price: number; coverThumbnail: string; slug: string }[]
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" })

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/account/orders", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/login?next=/account"
          return
        }
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || "Could not load orders")
        setOrders(d.orders)
      })
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 font-jost text-sm text-red-800">{error}</p>

  if (!orders) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-stone-100" />
        ))}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="When you place an order with this email, it will appear here with its progress."
        ctaLabel="Continue browsing"
        ctaHref="/"
      />
    )
  }

  return (
    <ul className="space-y-6">
      {orders.map((o, i) => {
        const progress = trackingProgress(o.status)
        return (
          <li key={o.orderCode}>
            <FadeIn delay={i * 60}>
              <article className="card-elevated overflow-hidden">
                <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-black/10 px-6 py-4 font-jost">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Order</p>
                    <p className="font-cinzel text-lg font-bold tracking-[0.15em]">{o.orderCode}</p>
                  </div>
                  <div className="text-sm text-black/60">
                    {fmtDate(o.createdAt)} · {paymentLabel(o.paymentMethod)}
                  </div>
                  <div className="w-full sm:w-auto sm:text-right">
                    <p className="text-sm font-semibold">{statusLabel(o.status)}</p>
                    <p className="text-sm tabular-nums text-black/60">{formatRupees(o.amount)}</p>
                  </div>
                </header>

                {progress >= 0 && (
                  <div className="border-b border-black/10 px-6 py-4">
                    <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
                      {TRACKING_STEPS.map((s, idx) => (
                        <li key={s.key} className="flex flex-col items-center gap-1.5 text-center">
                          <span className={`h-1 w-full rounded-full ${idx <= progress ? "bg-black" : "bg-black/10"}`} aria-hidden />
                          <span className={`font-jost text-[10px] leading-tight sm:text-xs ${idx === progress ? "font-semibold text-black" : "text-black/45"}`}>{s.label}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <ul className="divide-y divide-black/5 px-6">
                  {o.items.map((it) => (
                    <li key={it.id} className="flex items-center gap-4 py-3">
                      <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden bg-stone-100">
                        <Image src={it.coverThumbnail} alt="" fill sizes="3rem" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 font-jost">
                        <Link href={`/shop/${it.slug}`} className="text-sm font-semibold hover:underline">
                          {it.name}
                        </Link>
                        <p className="text-xs text-black/55">
                          Size {it.size} · Qty {it.quantity}
                        </p>
                      </div>
                      <p className="font-jost text-sm tabular-nums">{formatRupees(it.price * it.quantity)}</p>
                    </li>
                  ))}
                </ul>

                <footer className="flex flex-wrap gap-3 border-t border-black/10 px-6 py-4">
                  <Link href={`/invoice/${o.orderCode}`} className="btn-outline-dark !px-5 !py-2 !text-xs">
                    Invoice
                  </Link>
                  <a href={`/api/invoice/${o.orderCode}.pdf`} download className="btn-outline-dark !px-5 !py-2 !text-xs">
                    Download PDF
                  </a>
                </footer>
              </article>
            </FadeIn>
          </li>
        )
      })}
    </ul>
  )
}
