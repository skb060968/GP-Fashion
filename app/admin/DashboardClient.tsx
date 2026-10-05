"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, RefreshCw } from "lucide-react"
import { formatRupees } from "@/lib/money"
import { paymentLabel } from "@/lib/orders/labels"
import { TRANSITIONS, type Transition } from "@/lib/orders/transitions"
import StatusBadge from "@/components/StatusBadge"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Card, EmptyRow, Skeleton, btn } from "@/components/admin/ui"
import StatusChangeDialog, { type StatusChangeTarget } from "@/components/admin/StatusChangeDialog"
import { adminFetch } from "@/lib/admin/fetch"

type Row = {
  orderCode: string
  amount: number
  status: string
  paymentMethod: string
  createdAt: string
  itemCount: number
  address: { fullName: string; phone: string; email: string | null; city: string } | null
}

type Dashboard = {
  counts: Record<string, number>
  revenue: { thisMonth: number; prevMonth: number; paidOrdersThisMonth: number; ordersThisMonth: number }
  shippedLast7Days: number
  awaiting: Row[]
  recent: Row[]
  generatedAt: string
}

const VERIFY = TRANSITIONS.UNDER_VERIFICATION.find((t) => t.to === "VERIFIED")!
const REJECT = TRANSITIONS.UNDER_VERIFICATION.find((t) => t.to === "REJECTED")!

function age(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

const fmtShort = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })

const monthName = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", month: "long" })

export default function DashboardClient() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ tone: "success" | "error"; text: string } | null>(null)
  const [dialog, setDialog] = useState<{ target: StatusChangeTarget; transition: Transition } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminFetch<Dashboard>("/api/admin/dashboard"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(t)
  }, [flash])

  const c = data?.counts ?? {}
  const rev = data?.revenue
  const delta = rev && rev.prevMonth > 0 ? Math.round(((rev.thisMonth - rev.prevMonth) / rev.prevMonth) * 100) : null

  const kpis = [
    { label: "Awaiting verification", value: c.UNDER_VERIFICATION ?? 0, href: "/admin/orders?status=UNDER_VERIFICATION", tone: (c.UNDER_VERIFICATION ?? 0) > 0 ? "amber" : "plain" },
    { label: "Ready to process", value: c.VERIFIED ?? 0, href: "/admin/orders?status=VERIFIED", tone: "plain" },
    { label: "In production", value: c.PROCESSING ?? 0, href: "/admin/orders?status=PROCESSING", tone: "plain" },
    { label: "Shipped, last 7 days", value: data?.shippedLast7Days ?? 0, href: "/admin/orders?status=SHIPPED", tone: "plain" },
  ] as const

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description={data ? `Updated ${new Date(data.generatedAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false })}` : undefined}
        actions={
          <button type="button" onClick={load} disabled={loading} className={btn.secondary}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} strokeWidth={1.75} aria-hidden />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-5">
          <Alert onDismiss={() => setError(null)}>{error}</Alert>
        </div>
      )}
      {flash && (
        <div className="mb-5">
          <Alert tone={flash.tone} onDismiss={() => setFlash(null)}>
            {flash.text}
          </Alert>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={`group rounded-xl border bg-white p-4 transition-colors hover:border-black sm:p-5 ${k.tone === "amber" ? "border-amber-300" : "border-black/10"}`}
          >
            <p className="font-jost text-[11px] font-semibold uppercase tracking-[0.15em] text-black/55">{k.label}</p>
            {loading && !data ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 font-cinzel text-3xl font-bold tabular-nums">{k.value}</p>}
          </Link>
        ))}
      </div>

      {/* Revenue strip */}
      <div className="mt-4 grid gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-black p-5 text-white lg:col-span-1">
          <p className="font-jost text-[11px] font-semibold uppercase tracking-[0.15em] text-white/60">Revenue · {monthName}</p>
          {loading && !data ? (
            <Skeleton className="mt-3 h-8 w-32 bg-white/20" />
          ) : (
            <>
              <p className="mt-2 font-cinzel text-3xl font-bold tabular-nums">{formatRupees(rev?.thisMonth ?? 0)}</p>
              <p className="mt-1 font-jost text-xs text-white/60">
                {rev?.paidOrdersThisMonth ?? 0} paid of {rev?.ordersThisMonth ?? 0} orders
                {delta !== null && (
                  <span className={`ml-2 ${delta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {delta >= 0 ? "+" : ""}
                    {delta}% vs last month
                  </span>
                )}
              </p>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-2 lg:grid-cols-4">
          {(["DELIVERED", "REJECTED", "CANCELLED", "REFUNDED"] as const).map((s) => (
            <Link key={s} href={`/admin/orders?status=${s}`} className="rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-black">
              <StatusBadge status={s} />
              {loading && !data ? <Skeleton className="mt-3 h-6 w-10" /> : <p className="mt-2 font-jost text-2xl font-semibold tabular-nums">{c[s] ?? 0}</p>}
              <p className="font-jost text-[11px] text-black/45">all time</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Queues */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card
          title="Needs verification"
          padded={false}
          action={
            <Link href="/admin/orders?status=UNDER_VERIFICATION" className="inline-flex items-center gap-1 font-jost text-xs text-black/60 hover:text-black">
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        >
          {loading && !data ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : data && data.awaiting.length === 0 ? (
            <EmptyRow title="Nothing waiting" hint="Every UPI payment has been checked." />
          ) : (
            <ul className="divide-y divide-black/5">
              {data?.awaiting.map((o) => {
                const target: StatusChangeTarget = { orderCode: o.orderCode, status: o.status, customerEmail: o.address?.email ?? null }
                return (
                  <li key={o.orderCode} className="flex flex-wrap items-center gap-3 px-5 py-3 font-jost">
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/orders/${o.orderCode}`} className="text-sm font-semibold tracking-wide hover:underline">
                        {o.orderCode}
                      </Link>
                      <p className="truncate text-xs text-black/60">
                        {o.address?.fullName ?? "—"} · {formatRupees(o.amount)} · {paymentLabel(o.paymentMethod)} · {age(o.createdAt)} ago
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setDialog({ target, transition: VERIFY })} className={`${btn.primary} !px-3 !py-1.5 !text-xs`}>
                        Verify
                      </button>
                      <button type="button" onClick={() => setDialog({ target, transition: REJECT })} className={`${btn.secondary} !px-3 !py-1.5 !text-xs !text-red-700 hover:!bg-red-50`}>
                        Reject
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card
          title="Recent orders"
          padded={false}
          action={
            <Link href="/admin/orders" className="inline-flex items-center gap-1 font-jost text-xs text-black/60 hover:text-black">
              All orders <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        >
          {loading && !data ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : data && data.recent.length === 0 ? (
            <EmptyRow title="No orders yet" />
          ) : (
            <ul className="divide-y divide-black/5">
              {data?.recent.map((o) => (
                <li key={o.orderCode}>
                  <Link href={`/admin/orders/${o.orderCode}`} className="flex items-center gap-3 px-5 py-3 font-jost transition-colors hover:bg-stone-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold tracking-wide">{o.orderCode}</p>
                      <p className="truncate text-xs text-black/60">
                        {o.address?.fullName ?? "—"} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"} · {fmtShort(o.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{formatRupees(o.amount)}</p>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <StatusChangeDialog
        target={dialog?.target ?? null}
        transition={dialog?.transition ?? null}
        onClose={() => setDialog(null)}
        onDone={(_updated, summary) => {
          setDialog(null)
          setFlash({ tone: "success", text: summary })
          load()
        }}
        onError={(message) => {
          setDialog(null)
          setFlash({ tone: "error", text: message })
        }}
      />
    </>
  )
}
