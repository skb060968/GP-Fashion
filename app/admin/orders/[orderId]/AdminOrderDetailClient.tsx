"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Copy, Download, ExternalLink, Mail, MessageCircle, Phone } from "lucide-react"
import { formatRupees } from "@/lib/money"
import { adminStatusLabel, paymentLabel } from "@/lib/orders/labels"
import { allowedTransitions, type Transition } from "@/lib/orders/transitions"
import StatusBadge from "@/components/StatusBadge"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Card, Skeleton, btn, input } from "@/components/admin/ui"
import StatusChangeDialog from "@/components/admin/StatusChangeDialog"
import { adminFetch } from "@/lib/admin/fetch"

type Order = {
  orderCode: string
  amount: number
  discount: number
  couponCode: string | null
  paymentMethod: string
  status: string
  notes: string | null
  createdAt: string
  updatedAt: string
  razorpayPaymentId: string | null
  razorpayOrderId: string | null
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
  items: { id: string; name: string; slug: string; size: string; price: number; quantity: number; coverThumbnail: string }[]
  history: { id: string; status: string; changedAt: string; note: string | null }[]
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

const intentClass: Record<Transition["intent"], string> = {
  primary: btn.primary,
  secondary: btn.secondary,
  danger: `${btn.secondary} !text-red-700 hover:!bg-red-50`,
}

export default function AdminOrderDetailClient() {
  const params = useParams()
  const orderCode = typeof params?.orderId === "string" ? params.orderId : ""

  const [order, setOrder] = useState<Order | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ tone: "success" | "error"; text: string } | null>(null)

  // Status change dialog
  const [pending, setPending] = useState<Transition | null>(null)

  // Notes
  const [notes, setNotes] = useState("")
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesSavedAt, setNotesSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!orderCode) return
    adminFetch<Order>(`/api/admin/orders/${orderCode}`)
      .then((o) => {
        setOrder(o)
        setNotes(o.notes ?? "")
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed to load order"))
  }, [orderCode])

  const saveNotes = useCallback(async () => {
    if (!order) return
    setNotesSaving(true)
    try {
      const updated = await adminFetch<Order>(`/api/admin/orders/${order.orderCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notes", notes }),
      })
      setOrder(updated)
      setNotesSavedAt(Date.now())
    } catch (e) {
      setFlash({ tone: "error", text: e instanceof Error ? e.message : "Could not save notes." })
    } finally {
      setNotesSaving(false)
    }
  }, [order, notes])

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setFlash({ tone: "success", text: `${label} copied.` })
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(t)
  }, [flash])

  /* ------------------------------ states ------------------------------ */

  if (loadError) {
    return (
      <>
        <AdminPageHeader title={`Order ${orderCode}`} />
        <Alert>{loadError}</Alert>
        <Link href="/admin/orders" className={`${btn.secondary} mt-6`}>
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to orders
        </Link>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <AdminPageHeader title={`Order ${orderCode}`} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-40" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </>
    )
  }

  const a = order.address
  const subtotal = order.amount + order.discount
  const transitions = allowedTransitions(order.status)
  const addressText = a ? [a.fullName, a.addressLine1, a.addressLine2, `${a.city}, ${a.state} ${a.pincode}`, a.phone].filter(Boolean).join("\n") : ""
  const waNumber = a ? `91${a.phone.replace(/\D/g, "").slice(-10)}` : ""
  const history = [...order.history].sort((x, y) => new Date(y.changedAt).getTime() - new Date(x.changedAt).getTime())

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 font-jost text-sm text-black/60 hover:text-black">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Orders
      </Link>

      <AdminPageHeader
        title={`Order ${order.orderCode}`}
        description={`Placed ${fmtDateTime(order.createdAt)} · ${paymentLabel(order.paymentMethod)}`}
        actions={
          <>
            <StatusBadge status={order.status} size="md" />
            <a href={`/invoice/${order.orderCode}`} target="_blank" rel="noopener" className={btn.secondary}>
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Invoice
            </a>
            <a href={`/api/invoice/${order.orderCode}.pdf`} download className={btn.secondary}>
              <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden /> PDF
            </a>
          </>
        }
      />

      {flash && (
        <div className="mb-5">
          <Alert tone={flash.tone} onDismiss={() => setFlash(null)}>
            {flash.text}
          </Alert>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------------------------- main column ---------------------------- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Next steps */}
          <Card title="Next step">
            {transitions.length === 0 ? (
              <p className="font-jost text-sm text-black/60">This order is closed. No further changes are expected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {transitions.map((t) => (
                  <button key={t.to} type="button" onClick={() => setPending(t)} className={intentClass[t.intent]}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {order.status === "UNDER_VERIFICATION" && order.paymentMethod === "UPI_MANUAL" && (
              <p className="mt-4 rounded-md bg-amber-50 p-3 font-jost text-sm text-amber-900">
                Look for a UPI credit of <strong>{formatRupees(order.amount)}</strong> from <strong>{a?.fullName}</strong> around {fmtDateTime(order.createdAt)} before verifying.
              </p>
            )}
          </Card>

          {/* Items */}
          <Card title={`Items (${order.items.reduce((n, i) => n + i.quantity, 0)})`} padded={false}>
            <ul className="divide-y divide-black/5">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded bg-stone-100">
                    <Image src={it.coverThumbnail} alt="" fill sizes="3rem" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 font-jost">
                    <Link href={`/shop/${it.slug}`} target="_blank" className="text-sm font-semibold hover:underline">
                      {it.name}
                    </Link>
                    <p className="text-xs text-black/55">
                      Size {it.size} · Qty {it.quantity} · {formatRupees(it.price)} each
                    </p>
                  </div>
                  <p className="font-jost text-sm font-semibold tabular-nums">{formatRupees(it.price * it.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-black/10 px-5 py-4 font-jost text-sm">
              <div className="flex justify-between text-black/65">
                <dt>Subtotal</dt>
                <dd className="tabular-nums text-black">{formatRupees(subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-black/65">
                  <dt>Discount{order.couponCode ? ` · ${order.couponCode}` : ""}</dt>
                  <dd className="tabular-nums text-black">−{formatRupees(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-black/10 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatRupees(order.amount)}</dd>
              </div>
            </dl>
          </Card>

          {/* Timeline */}
          <Card title="History" padded={false}>
            <ol className="divide-y divide-black/5">
              {history.map((h, i) => (
                <li key={h.id} className="flex gap-4 px-5 py-3.5">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${i === 0 ? "bg-black" : "bg-black/20"}`} aria-hidden />
                  <div className="min-w-0 flex-1 font-jost">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <p className="text-sm font-medium">{adminStatusLabel(h.status)}</p>
                      <p className="text-xs text-black/50">{fmtDateTime(h.changedAt)}</p>
                    </div>
                    {h.note && <p className="mt-1 text-sm text-black/65">{h.note}</p>}
                  </div>
                </li>
              ))}
              {history.length === 0 && <li className="px-5 py-4 font-jost text-sm text-black/50">No history recorded.</li>}
            </ol>
          </Card>
        </div>

        {/* ---------------------------- side column ---------------------------- */}
        <div className="space-y-6">
          {/* Customer */}
          <Card
            title="Customer"
            action={
              a && (
                <button type="button" onClick={() => copy(addressText, "Address")} className={`${btn.ghost} !px-2 !py-1 !text-xs`}>
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden /> Copy
                </button>
              )
            }
          >
            {a ? (
              <div className="font-jost text-sm">
                <p className="font-semibold">{a.fullName}</p>
                <address className="mt-1 not-italic leading-relaxed text-black/70">
                  {a.addressLine1}
                  {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                </address>
                <div className="mt-4 space-y-2">
                  <a href={`tel:${a.phone}`} className="flex items-center gap-2 text-black/75 hover:text-black">
                    <Phone className="h-4 w-4" strokeWidth={1.75} aria-hidden /> {a.phone}
                  </a>
                  {a.email && (
                    <a href={`mailto:${a.email}`} className="flex items-center gap-2 break-all text-black/75 hover:text-black">
                      <Mail className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden /> {a.email}
                    </a>
                  )}
                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${a.fullName.split(" ")[0]}, regarding your Piyush Bholla order ${order.orderCode}:`)}`}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-2 text-black/75 hover:text-black"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden /> WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <p className="font-jost text-sm text-black/50">No address on this order.</p>
            )}
          </Card>

          {/* Payment */}
          <Card title="Payment">
            <dl className="space-y-2 font-jost text-sm">
              <div className="flex justify-between">
                <dt className="text-black/60">Method</dt>
                <dd>{paymentLabel(order.paymentMethod)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-black/60">Amount</dt>
                <dd className="font-semibold tabular-nums">{formatRupees(order.amount)}</dd>
              </div>
              {order.razorpayPaymentId && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-black/60">Razorpay</dt>
                  <dd className="flex items-center gap-1 font-mono text-xs">
                    {order.razorpayPaymentId}
                    <button type="button" onClick={() => copy(order.razorpayPaymentId!, "Payment ID")} aria-label="Copy payment ID" className="rounded p-1 hover:bg-black/5">
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-black/60">Last updated</dt>
                <dd className="text-black/75">{fmtDateTime(order.updatedAt)}</dd>
              </div>
            </dl>
          </Card>

          {/* Notes */}
          <Card
            title="Internal notes"
            action={
              <span className="font-jost text-[11px] text-black/45">
                {notesSaving ? "Saving…" : notesSavedAt ? "Saved" : notes !== (order.notes ?? "") ? "Unsaved" : ""}
              </span>
            }
          >
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value)
                setNotesSavedAt(null)
              }}
              rows={5}
              placeholder="UTR, courier tracking number, customer calls… Only visible here."
              className={`${input} w-full resize-y`}
            />
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={saveNotes} disabled={notesSaving || notes === (order.notes ?? "")} className={btn.primary}>
                Save notes
              </button>
            </div>
          </Card>
        </div>
      </div>

      <StatusChangeDialog<Order>
        target={pending ? { orderCode: order.orderCode, status: order.status, customerEmail: a?.email ?? null } : null}
        transition={pending}
        onClose={() => setPending(null)}
        onDone={(updated, summary) => {
          setOrder(updated)
          setFlash({ tone: "success", text: summary })
          setPending(null)
        }}
        onError={(message) => {
          setFlash({ tone: "error", text: message })
          setPending(null)
        }}
      />    </>
  )
}
