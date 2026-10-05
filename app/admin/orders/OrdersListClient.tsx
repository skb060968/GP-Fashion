"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Download, Search, X } from "lucide-react"
import { formatRupees } from "@/lib/money"
import { adminStatusLabel, paymentLabel } from "@/lib/orders/labels"
import { ORDER_STATUSES } from "@/lib/orders/transitions"
import StatusBadge from "@/components/StatusBadge"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, EmptyRow, Skeleton, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"

type Row = {
  orderCode: string
  amount: number
  discount: number
  couponCode: string | null
  status: string
  paymentMethod: string
  createdAt: string
  updatedAt: string
  itemCount: number
  address: { fullName: string; phone: string; email: string | null; city: string } | null
}

type ListResponse = {
  orders: Row[]
  counts: Record<string, number>
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const CHIPS: { key: string; label: string }[] = [
  { key: "All", label: "All" },
  ...ORDER_STATUSES.map((s) => ({ key: s, label: adminStatusLabel(s) })),
]

const PAYMENT_OPTIONS = [
  { value: "", label: "All payments" },
  { value: "UPI_MANUAL", label: paymentLabel("UPI_MANUAL") },
  { value: "RAZORPAY", label: paymentLabel("RAZORPAY") },
  { value: "COD", label: paymentLabel("COD") },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export default function OrdersListClient() {
  const router = useRouter()
  const sp = useSearchParams()

  // Filters live in the URL so the back button and refresh keep them.
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1)
  const status = sp.get("status") ?? "All"
  const paymentMethod = sp.get("paymentMethod") ?? ""
  const from = sp.get("from") ?? ""
  const to = sp.get("to") ?? ""
  const search = sp.get("search") ?? ""

  const [searchInput, setSearchInput] = useState(search)
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setParams = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || (k === "status" && v === "All")) next.delete(k)
        else next.set(k, v)
      }
      if (resetPage) next.delete("page")
      router.replace(`/admin/orders${next.toString() ? `?${next}` : ""}`, { scroll: false })
    },
    [router, sp]
  )

  // Debounced search → URL
  useEffect(() => {
    if (searchInput === search) return
    const t = setTimeout(() => setParams({ search: searchInput.trim() }), 300)
    return () => clearTimeout(t)
  }, [searchInput, search, setParams])

  const query = useMemo(() => {
    const q = new URLSearchParams()
    q.set("page", String(page))
    if (search) q.set("search", search)
    if (status !== "All") q.set("status", status)
    if (paymentMethod) q.set("paymentMethod", paymentMethod)
    if (from) q.set("from", from)
    if (to) q.set("to", to)
    return q.toString()
  }, [page, search, status, paymentMethod, from, to])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    adminFetch<ListResponse>(`/api/admin/orders?${query}`)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load orders"))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [query])

  const hasFilters = Boolean(search || status !== "All" || paymentMethod || from || to)
  const exportHref = `/api/admin/orders/export?${query.replace(/(^|&)page=\d+/, "")}`
  const counts = data?.counts ?? {}

  return (
    <>
      <AdminPageHeader
        title="Orders"
        description={data ? `${data.totalCount} ${data.totalCount === 1 ? "order" : "orders"}${hasFilters ? " match these filters" : ""}` : undefined}
        actions={
          <a href={exportHref} download className={btn.secondary}>
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Export CSV
          </a>
        }
      />

      {/* Status chips */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          {CHIPS.map((c) => {
            const active = status === c.key
            const n = counts[c.key]
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setParams({ status: c.key })}
                aria-pressed={active}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-jost text-xs font-medium transition-colors focus-visible:ring-black ${
                  active ? "border-black bg-black text-white" : "border-black/15 bg-white text-black/70 hover:border-black hover:text-black"
                }`}
              >
                {c.label}
                {n !== undefined && (
                  <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-black/5"}`}>{n}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Search + filters */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" strokeWidth={1.75} aria-hidden />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search order no., name, phone or email"
            aria-label="Search orders"
            className={`${input} w-full pl-9`}
          />
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setParams({ paymentMethod: e.target.value })}
          aria-label="Payment method"
          className={input}
        >
          {PAYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(e) => setParams({ from: e.target.value })} aria-label="From date" className={input} />
          <span className="font-jost text-xs text-black/40">to</span>
          <input type="date" value={to} min={from || undefined} onChange={(e) => setParams({ to: e.target.value })} aria-label="To date" className={input} />
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("")
              router.replace("/admin/orders", { scroll: false })
            }}
            className={`${btn.ghost} !px-3`}
          >
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <Alert onDismiss={() => setError(null)}>{error}</Alert>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-black/10 bg-white md:block">
        <table className="w-full text-left font-jost text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.15em] text-black/55">
            <tr>
              <th className="px-4 py-3 font-semibold">Order</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 text-right font-semibold">Items</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Placed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading && !data
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.orders.map((o) => (
                  <tr
                    key={o.orderCode}
                    onClick={() => router.push(`/admin/orders/${o.orderCode}`)}
                    className={`cursor-pointer transition-colors hover:bg-stone-50 ${loading ? "opacity-60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.orderCode}`} className="font-semibold tracking-wide hover:underline" onClick={(e) => e.stopPropagation()}>
                        {o.orderCode}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{o.address?.fullName ?? "—"}</div>
                      <div className="text-xs text-black/55">
                        {o.address?.phone}
                        {o.address?.city ? ` · ${o.address.city}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{o.itemCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold tabular-nums">{formatRupees(o.amount)}</div>
                      {o.discount > 0 && <div className="text-xs text-black/55">{o.couponCode ?? "discount"} −{formatRupees(o.discount)}</div>}
                    </td>
                    <td className="px-4 py-3 text-black/75">{paymentLabel(o.paymentMethod)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-black/60">{fmtDate(o.createdAt)}</td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && data && data.orders.length === 0 && (
          <EmptyRow
            title="No orders match"
            hint={hasFilters ? "Try widening the search or clearing filters." : "Orders will appear here as customers check out."}
            action={
              hasFilters ? (
                <button type="button" onClick={() => { setSearchInput(""); router.replace("/admin/orders", { scroll: false }) }} className={btn.secondary}>
                  Clear filters
                </button>
              ) : undefined
            }
          />
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading && !data
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-white p-4">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-4 w-1/2" />
              </div>
            ))
          : data?.orders.map((o) => (
              <Link
                key={o.orderCode}
                href={`/admin/orders/${o.orderCode}`}
                className={`block rounded-xl border border-black/10 bg-white p-4 font-jost transition-colors hover:border-black ${loading ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold tracking-wide">{o.orderCode}</p>
                    <p className="mt-0.5 text-xs text-black/55">{fmtDate(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{o.address?.fullName ?? "—"}</p>
                    <p className="text-xs text-black/55">
                      {o.address?.phone} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"} · {paymentLabel(o.paymentMethod)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">{formatRupees(o.amount)}</p>
                </div>
              </Link>
            ))}
        {!loading && data && data.orders.length === 0 && (
          <div className="rounded-xl border border-black/10 bg-white">
            <EmptyRow title="No orders match" hint={hasFilters ? "Try clearing the filters." : undefined} />
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between font-jost text-sm">
          <p className="text-black/60">
            Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.totalCount)} of {data.totalCount}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setParams({ page: String(page - 1) }, false)} disabled={page <= 1} className={btn.secondary}>
              Previous
            </button>
            <span className="px-2 tabular-nums text-black/60">
              {data.page} / {data.totalPages}
            </span>
            <button type="button" onClick={() => setParams({ page: String(page + 1) }, false)} disabled={page >= data.totalPages} className={btn.secondary}>
              Next
            </button>
          </div>
        </div>
      )}
    </>
  )
}
