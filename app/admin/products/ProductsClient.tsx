"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Check, ExternalLink, Mail, Search, X } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Dialog, EmptyRow, Skeleton, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { formatRupees } from "@/lib/money"
import type { AdminProduct, ProductStatus, ProductUsage } from "@/lib/admin/products"

type Filter = "all" | ProductStatus

const STATUS_LABEL: Record<ProductStatus, string> = { AVAILABLE: "Available", SOLD_OUT: "Sold out", HIDDEN: "Hidden" }

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "AVAILABLE", label: "Available" },
  { key: "SOLD_OUT", label: "Sold out" },
  { key: "HIDDEN", label: "Hidden" },
]

const PILL: Record<ProductStatus, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  SOLD_OUT: "bg-stone-900 text-white ring-stone-900",
  HIDDEN: "bg-amber-50 text-amber-800 ring-amber-200",
}

const CONSEQUENCES: Record<Exclude<ProductStatus, "AVAILABLE">, string[]> = {
  SOLD_OUT: [
    "It stays on the site with a Sold out label, at the end of listings.",
    "Add to bag, Buy now and Made to measure are switched off. Customers can ask to be emailed when it is back.",
    "Bags and wishlists show it as sold out, and it can no longer be ordered.",
  ],
  HIDDEN: [
    "Its page shows Page not found and it disappears from listings and search.",
    "Bags and wishlists show it as unavailable, and it can no longer be ordered.",
  ],
}

type Pending = { product: AdminProduct; to: ProductStatus }

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export default function ProductsClient() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [search, setSearch] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [usage, setUsage] = useState<ProductUsage | null>(null)
  const [usageError, setUsageError] = useState<string | null>(null)
  const [notifyWaiting, setNotifyWaiting] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ products: AdminProduct[] }>("/api/admin/products")
      setProducts(data.products)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load products")
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const list = products ?? []
    const by = (s: ProductStatus) => list.filter((p) => p.status === s).length
    return { all: list.length, AVAILABLE: by("AVAILABLE"), SOLD_OUT: by("SOLD_OUT"), HIDDEN: by("HIDDEN") }
  }, [products])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (products ?? [])
      .filter((p) => filter === "all" || p.status === filter)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.slug.includes(q))
  }, [products, filter, search])

  const patchRow = (slug: string, patch: Partial<AdminProduct>) =>
    setProducts((list) => list?.map((p) => (p.slug === slug ? { ...p, ...patch } : p)) ?? null)

  const applyStatus = async (product: AdminProduct, to: ProductStatus, notify: boolean) => {
    setBusy(product.slug)
    setError(null)
    try {
      const result = await adminFetch<{ slug: string; status: ProductStatus; since: string | null; waiting: number; emailing: number }>(
        `/api/admin/products/${encodeURIComponent(product.slug)}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: to, notifyWaiting: notify }) }
      )
      patchRow(result.slug, { status: result.status, since: result.since, waiting: result.emailing > 0 ? 0 : result.waiting })
      const what =
        result.status === "AVAILABLE" ? "is available again" : result.status === "SOLD_OUT" ? "is marked sold out" : "is hidden"
      setFlash(
        `${product.name} ${what}. The site updates within a few seconds.${
          result.emailing > 0 ? ` Emailing ${plural(result.emailing, "waiting customer", "waiting customers")} now.` : ""
        }`
      )
      setPending(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not update ${product.name}`)
      setPending(null)
    } finally {
      setBusy(null)
    }
  }

  const emailWaiting = async (product: AdminProduct) => {
    setBusy(product.slug)
    setError(null)
    try {
      const result = await adminFetch<{ emailing: number }>(`/api/admin/products/${encodeURIComponent(product.slug)}/restock-emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
      patchRow(product.slug, { waiting: 0 })
      setFlash(`Emailing ${plural(result.emailing, "waiting customer", "waiting customers")} about ${product.name}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the emails")
    } finally {
      setBusy(null)
    }
  }

  const choose = async (product: AdminProduct, to: ProductStatus) => {
    if (to === product.status) return
    if (to === "AVAILABLE" && product.waiting === 0) {
      applyStatus(product, to, false)
      return
    }
    setPending({ product, to })
    setNotifyWaiting(true)
    setUsage(null)
    setUsageError(null)
    if (to === "AVAILABLE") return
    try {
      const data = await adminFetch<{ usage: ProductUsage }>(`/api/admin/products/${encodeURIComponent(product.slug)}`)
      setUsage(data.usage)
    } catch (e) {
      setUsageError(e instanceof Error ? e.message : "Could not count bags and wishlists")
    }
  }

  const statusSelect = (p: AdminProduct) => (
    <label className="relative">
      <span className="sr-only">Status of {p.name}</span>
      <select
        value={p.status}
        disabled={busy === p.slug}
        onChange={(e) => choose(p, e.target.value as ProductStatus)}
        className={`${input} h-9 cursor-pointer py-0 pr-8 disabled:cursor-wait disabled:opacity-50`}
      >
        {(Object.keys(STATUS_LABEL) as ProductStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
    </label>
  )

  const pill = (p: AdminProduct) => (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${PILL[p.status]}`}>
      {STATUS_LABEL[p.status]}
      {p.since ? ` since ${fmtDate(p.since)}` : ""}
    </span>
  )

  const dialogTarget = pending?.product
  const toAvailable = pending?.to === "AVAILABLE"
  const dialogTitle = !pending ? "" : toAvailable ? `Make ${pending.product.name} available?` : `Mark ${pending.product.name} ${pending.to === "SOLD_OUT" ? "sold out" : "hidden"}?`

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={products ? `${counts.AVAILABLE} available · ${counts.SOLD_OUT} sold out · ${counts.HIDDEN} hidden` : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={active}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-jost text-xs font-medium transition-colors focus-visible:ring-black ${
                  active ? "border-black bg-black text-white" : "border-black/15 bg-white text-black/70 hover:border-black hover:text-black"
                }`}
              >
                {f.label}
                {products && <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-black/5"}`}>{counts[f.key]}</span>}
              </button>
            )
          })}
        </div>
        <label className="relative block min-w-[14rem] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" strokeWidth={1.75} aria-hidden />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name" aria-label="Search products" className={`${input} w-full pl-9`} />
        </label>
      </div>

      {error && <div className="mb-4"><Alert onDismiss={() => setError(null)}>{error}</Alert></div>}
      {flash && <div className="mb-4"><Alert tone="success" onDismiss={() => setFlash(null)}>{flash}</Alert></div>}

      <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
        {!products ? (
          <ul className="divide-y divide-black/5">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-16 w-12" />
                <div className="flex-1"><Skeleton className="h-4 w-1/3" /><Skeleton className="mt-2 h-3 w-1/4" /></div>
              </li>
            ))}
          </ul>
        ) : shown.length === 0 ? (
          <EmptyRow
            title={filter !== "all" && !search ? `No ${STATUS_LABEL[filter].toLowerCase()} products` : "No products match"}
            hint={search ? "Try another search or filter." : undefined}
            action={
              search || filter !== "all" ? (
                <button type="button" onClick={() => { setSearch(""); setFilter("all") }} className={btn.secondary}>
                  <X className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Clear
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-black/5 font-jost text-sm">
            {shown.map((p) => (
              <li key={p.slug} data-slug={p.slug} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 md:flex-nowrap">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-stone-100">
                  <Image src={p.coverThumbnail} alt="" fill sizes="3rem" className={`object-cover ${p.status === "HIDDEN" ? "opacity-50 grayscale" : ""}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-black/55">
                    {p.category} · {p.classification} · <span className="tabular-nums">{formatRupees(p.price)}</span>
                  </p>
                  {p.waiting > 0 && (
                    <p className="mt-0.5 text-xs font-medium text-black/70" data-testid="waiting">
                      {plural(p.waiting, "customer", "customers")} waiting for a restock email
                    </p>
                  )}
                </div>
                <div className="flex w-full flex-wrap items-center justify-between gap-2 md:w-auto md:flex-nowrap md:justify-end">
                  {pill(p)}
                  <div className="flex items-center gap-1">
                    {p.status === "AVAILABLE" && p.waiting > 0 && (
                      <button type="button" onClick={() => emailWaiting(p)} disabled={busy === p.slug} className={`${btn.secondary} !px-3`}>
                        <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Email {p.waiting}
                      </button>
                    )}
                    {p.status !== "HIDDEN" && (
                      <a
                        href={`/shop/${p.slug}`}
                        target="_blank"
                        rel="noopener"
                        aria-label={`View ${p.name} on the site`}
                        className={`${btn.ghost} !p-2`}
                      >
                        <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      </a>
                    )}
                    {statusSelect(p)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={Boolean(pending)}
        onClose={() => busy === null && setPending(null)}
        title={dialogTitle}
        description={toAvailable ? "It goes back on sale within a few seconds." : "The site updates within a few seconds. You can change it back at any time."}
        footer={
          <>
            <button type="button" onClick={() => setPending(null)} disabled={busy !== null} className={btn.secondary}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => pending && applyStatus(pending.product, pending.to, toAvailable && notifyWaiting)}
              disabled={busy !== null || (!toAvailable && !usage && !usageError)}
              className={pending?.to === "HIDDEN" ? btn.danger : btn.primary}
            >
              {busy ? "Saving…" : toAvailable ? "Make available" : pending?.to === "SOLD_OUT" ? "Mark sold out" : "Hide product"}
            </button>
          </>
        }
      >
        {pending && dialogTarget && (
          <div className="space-y-4 font-jost text-sm">
            {toAvailable ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 p-3">
                <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={notifyWaiting}
                    onChange={(e) => setNotifyWaiting(e.target.checked)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-black/30 checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  />
                  <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
                </span>
                <span>
                  <span className="font-medium">Email the {plural(dialogTarget.waiting, "customer", "customers")} waiting</span>
                  <span className="mt-0.5 block text-xs text-black/55">
                    One “{dialogTarget.name} is back” email each. Their requests are then removed.
                  </span>
                </span>
              </label>
            ) : (
              <>
                {usageError ? (
                  <Alert>{usageError}. You can still continue.</Alert>
                ) : !usage ? (
                  <div className="space-y-2" aria-label="Counting bags and wishlists">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/5" />
                  </div>
                ) : (
                  <ul className="space-y-1.5" data-testid="usage">
                    <li>In <strong>{plural(usage.bags, "signed-in customer's bag", "signed-in customers' bags")}</strong></li>
                    <li>In <strong>{plural(usage.wishlists, "wishlist", "wishlists")}</strong></li>
                    <li>
                      <strong>{plural(usage.openOrders, "open order includes", "open orders include")}</strong> it
                      {usage.openOrders > 0 ? ". Those orders are not affected, so the piece is still owed." : "."}
                    </li>
                  </ul>
                )}
                <ul className="list-disc space-y-1 pl-5 text-black/65">
                  {CONSEQUENCES[pending.to as Exclude<ProductStatus, "AVAILABLE">].map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                  <li>Guests&apos; bags and wishlists are not counted.</li>
                </ul>
              </>
            )}
          </div>
        )}
      </Dialog>
    </>
  )
}
