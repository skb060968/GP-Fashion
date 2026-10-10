"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Pause, Pencil, Play, Plus, Search, Trash2, X } from "lucide-react"
import CouponForm from "./CouponForm"
import type { Coupon } from "./types"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Dialog, EmptyRow, Skeleton, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { COUPON_STATE_LABEL, discountSummary, minOrderSummary, type CouponState } from "@/lib/admin/couponStatus"

type ListResponse = {
  coupons: Coupon[]
  counts: Record<string, number>
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

const CHIPS: { key: "All" | CouponState; label: string }[] = [
  { key: "All", label: "All" },
  { key: "ACTIVE", label: COUPON_STATE_LABEL.ACTIVE },
  { key: "INACTIVE", label: COUPON_STATE_LABEL.INACTIVE },
  { key: "EXPIRED", label: COUPON_STATE_LABEL.EXPIRED },
  { key: "EXHAUSTED", label: COUPON_STATE_LABEL.EXHAUSTED },
]

const STATE_STYLE: Record<CouponState, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  INACTIVE: "bg-stone-100 text-stone-700 ring-stone-200",
  EXPIRED: "bg-amber-50 text-amber-800 ring-amber-200",
  EXHAUSTED: "bg-stone-100 text-stone-700 ring-stone-200",
}

function StatePill({ state }: { state: CouponState }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 font-jost text-xs font-medium ring-1 ring-inset ${STATE_STYLE[state]}`}>
      {COUPON_STATE_LABEL[state]}
    </span>
  )
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })

function Usage({ c }: { c: Coupon }) {
  if (c.maxUses == null) return <span className="font-jost text-sm tabular-nums">{c.currentUses}</span>
  const pct = Math.min(100, Math.round((c.currentUses / c.maxUses) * 100))
  return (
    <div className="min-w-[6rem]">
      <div className="flex justify-between font-jost text-xs tabular-nums">
        <span>
          {c.currentUses} / {c.maxUses}
        </span>
        <span className="text-black/45">{pct}%</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/10">
        <div className={`h-full ${pct >= 100 ? "bg-black/40" : "bg-black"}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function CouponListClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1)
  const state = sp.get("state") ?? "All"
  const search = sp.get("search") ?? ""

  const [searchInput, setSearchInput] = useState(search)
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const [form, setForm] = useState<{ open: boolean; coupon?: Coupon }>({ open: false })
  const [deleting, setDeleting] = useState<Coupon | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const setParams = useCallback(
    (patch: Record<string, string | null>, resetPage = true) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || (k === "state" && v === "All")) next.delete(k)
        else next.set(k, v)
      }
      if (resetPage) next.delete("page")
      router.replace(`/admin/coupons${next.toString() ? `?${next}` : ""}`, { scroll: false })
    },
    [router, sp]
  )

  useEffect(() => {
    if (searchInput === search) return
    const t = setTimeout(() => setParams({ search: searchInput.trim() }), 300)
    return () => clearTimeout(t)
  }, [searchInput, search, setParams])

  const query = useMemo(() => {
    const q = new URLSearchParams({ page: String(page) })
    if (search) q.set("search", search)
    if (state !== "All") q.set("state", state)
    return q.toString()
  }, [page, search, state])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminFetch<ListResponse>(`/api/admin/coupons?${query}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load coupons")
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 4000)
    return () => clearTimeout(t)
  }, [flash])

  const toggle = async (c: Coupon) => {
    setBusyId(c.id)
    try {
      const { coupon } = await adminFetch<{ coupon: Coupon }>(`/api/admin/coupons/${c.id}/toggle`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" })
      setData((d) => d && { ...d, coupons: d.coupons.map((x) => (x.id === c.id ? coupon : x)) })
      setFlash(`${c.code} ${coupon.isActive ? "resumed" : "paused"}.`)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the coupon")
    } finally {
      setBusyId(null)
    }
  }

  const remove = async () => {
    if (!deleting) return
    setBusyId(deleting.id)
    try {
      await adminFetch(`/api/admin/coupons/${deleting.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: "{}" })
      setFlash(`${deleting.code} deleted.`)
      setDeleting(null)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the coupon")
      setDeleting(null)
    } finally {
      setBusyId(null)
    }
  }

  const hasFilters = Boolean(search || state !== "All")
  const counts = data?.counts ?? {}

  const actions = (c: Coupon) => (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => setForm({ open: true, coupon: c })} aria-label={`Edit ${c.code}`} className={`${btn.ghost} !p-2`}>
        <Pencil className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        onClick={() => toggle(c)}
        disabled={busyId === c.id}
        aria-label={c.isActive ? `Pause ${c.code}` : `Resume ${c.code}`}
        className={`${btn.ghost} !p-2`}
      >
        {c.isActive ? <Pause className="h-4 w-4" strokeWidth={1.75} /> : <Play className="h-4 w-4" strokeWidth={1.75} />}
      </button>
      <button type="button" onClick={() => setDeleting(c)} aria-label={`Delete ${c.code}`} className={`${btn.ghost} !p-2 hover:!text-red-700`}>
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )

  return (
    <>
      <AdminPageHeader
        title="Coupons"
        description={data ? `${data.totalCount} ${data.totalCount === 1 ? "coupon" : "coupons"}${hasFilters ? " match" : ""}` : undefined}
        actions={
          <button type="button" onClick={() => setForm({ open: true })} className={btn.primary}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden /> New coupon
          </button>
        }
      />

      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2">
          {CHIPS.map((c) => {
            const active = state === c.key
            const n = counts[c.key]
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setParams({ state: c.key })}
                aria-pressed={active}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-jost text-xs font-medium transition-colors focus-visible:ring-black ${
                  active ? "border-black bg-black text-white" : "border-black/15 bg-white text-black/70 hover:border-black hover:text-black"
                }`}
              >
                {c.label}
                {n !== undefined && <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-black/5"}`}>{n}</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative block min-w-[16rem] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" strokeWidth={1.75} aria-hidden />
          <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search code" aria-label="Search coupons" className={`${input} w-full pl-9`} />
        </label>
        {hasFilters && (
          <button type="button" onClick={() => { setSearchInput(""); router.replace("/admin/coupons", { scroll: false }) }} className={`${btn.ghost} !px-3`}>
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Clear
          </button>
        )}
      </div>

      {error && <div className="mb-4"><Alert onDismiss={() => setError(null)}>{error}</Alert></div>}
      {flash && <div className="mb-4"><Alert tone="success" onDismiss={() => setFlash(null)}>{flash}</Alert></div>}

      <div className="hidden overflow-hidden rounded-xl border border-black/10 bg-white md:block">
        <table className="w-full text-left font-jost text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.15em] text-black/55">
            <tr>
              <th className="px-4 py-3 font-semibold">Code</th>
              <th className="px-4 py-3 font-semibold">Discount</th>
              <th className="px-4 py-3 font-semibold">Usage</th>
              <th className="px-4 py-3 font-semibold">Expires</th>
              <th className="px-4 py-3 font-semibold">State</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {loading && !data
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((__, j) => <td key={j} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td>)}</tr>
                ))
              : data?.coupons.map((c) => (
                  <tr key={c.id} className={`transition-colors hover:bg-stone-50 ${loading ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold tracking-wider">{c.code}</span>
                      <p className="text-xs text-black/45">Created {fmtDate(c.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{discountSummary(c)}</p>
                      {c.minOrderAmount ? <p className="text-xs text-black/55">{minOrderSummary(c)}</p> : null}
                    </td>
                    <td className="px-4 py-3"><Usage c={c} /></td>
                    <td className="px-4 py-3 text-black/70">{c.expiresAt ? fmtDate(c.expiresAt) : "—"}</td>
                    <td className="px-4 py-3"><StatePill state={c.state} /></td>
                    <td className="px-4 py-3"><div className="flex justify-end">{actions(c)}</div></td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && data && data.coupons.length === 0 && (
          <EmptyRow
            title={hasFilters ? "No coupons match" : "No coupons yet"}
            hint={hasFilters ? "Try another search or clear the filters." : "Create a code customers can apply at checkout."}
            action={
              hasFilters ? (
                <button type="button" onClick={() => { setSearchInput(""); router.replace("/admin/coupons", { scroll: false }) }} className={btn.secondary}>Clear filters</button>
              ) : (
                <button type="button" onClick={() => setForm({ open: true })} className={btn.primary}><Plus className="h-4 w-4" aria-hidden /> New coupon</button>
              )
            }
          />
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {loading && !data
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-black/10 bg-white p-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="mt-3 h-4 w-2/3" /></div>
            ))
          : data?.coupons.map((c) => (
              <div key={c.id} className="rounded-xl border border-black/10 bg-white p-4 font-jost">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold tracking-wider">{c.code}</p>
                    <p className="mt-0.5 text-sm">{discountSummary(c)} {c.minOrderAmount ? <span className="text-black/55">{minOrderSummary(c)}</span> : null}</p>
                  </div>
                  <StatePill state={c.state} />
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="text-xs text-black/55">
                    <Usage c={c} />
                    <p className="mt-1">{c.expiresAt ? `Expires ${fmtDate(c.expiresAt)}` : "No expiry"}</p>
                  </div>
                  {actions(c)}
                </div>
              </div>
            ))}
        {!loading && data && data.coupons.length === 0 && (
          <div className="rounded-xl border border-black/10 bg-white"><EmptyRow title={hasFilters ? "No coupons match" : "No coupons yet"} /></div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between font-jost text-sm">
          <p className="text-black/60">Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.totalCount)} of {data.totalCount}</p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setParams({ page: String(page - 1) }, false)} disabled={page <= 1} className={btn.secondary}>Previous</button>
            <span className="px-2 tabular-nums text-black/60">{data.page} / {data.totalPages}</span>
            <button type="button" onClick={() => setParams({ page: String(page + 1) }, false)} disabled={page >= data.totalPages} className={btn.secondary}>Next</button>
          </div>
        </div>
      )}

      {form.open && (
        <CouponForm
          coupon={form.coupon}
          onClose={() => setForm({ open: false })}
          onSaved={(saved) => {
            setForm({ open: false })
            setFlash(form.coupon ? `${saved.code} updated.` : `${saved.code} created.`)
            load()
          }}
        />
      )}

      <Dialog
        open={Boolean(deleting)}
        onClose={() => busyId === null && setDeleting(null)}
        title="Delete coupon"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setDeleting(null)} disabled={busyId !== null} className={btn.secondary}>Cancel</button>
            <button type="button" onClick={remove} disabled={busyId !== null} className={btn.danger}>{busyId ? "Deleting…" : "Delete"}</button>
          </>
        }
      >
        {deleting && (
          <div className="space-y-3 font-jost text-sm">
            <p>
              Delete <span className="font-mono font-semibold">{deleting.code}</span>? This cannot be undone.
            </p>
            {deleting.currentUses > 0 ? (
              <p className="rounded-md bg-amber-50 p-3 text-amber-900">
                This code has been used on {deleting.currentUses} {deleting.currentUses === 1 ? "order" : "orders"}. Those orders keep their discount, but you will lose the ability to see this coupon&apos;s details. Pausing it instead keeps the record.
              </p>
            ) : (
              <p className="text-black/60">It has never been used.</p>
            )}
          </div>
        )}
      </Dialog>
    </>
  )
}
