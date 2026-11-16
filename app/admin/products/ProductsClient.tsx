"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Eye, EyeOff, ExternalLink, Search, X } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Dialog, EmptyRow, Skeleton, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { formatRupees } from "@/lib/money"
import type { AdminProduct, ProductUsage } from "@/lib/admin/products"

type Filter = "all" | "live" | "hidden"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "hidden", label: "Hidden" },
]

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
  const [confirming, setConfirming] = useState<AdminProduct | null>(null)
  const [usage, setUsage] = useState<ProductUsage | null>(null)
  const [usageError, setUsageError] = useState<string | null>(null)

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
    const hidden = list.filter((p) => p.hidden).length
    return { all: list.length, live: list.length - hidden, hidden }
  }, [products])

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (products ?? [])
      .filter((p) => (filter === "all" ? true : filter === "hidden" ? p.hidden : !p.hidden))
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.slug.includes(q))
  }, [products, filter, search])

  const setVisibility = async (product: AdminProduct, hidden: boolean) => {
    setBusy(product.slug)
    setError(null)
    try {
      const result = await adminFetch<{ slug: string; hidden: boolean; hiddenAt: string | null }>(
        `/api/admin/products/${encodeURIComponent(product.slug)}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden }) }
      )
      setProducts((list) => list?.map((p) => (p.slug === result.slug ? { ...p, hidden: result.hidden, hiddenAt: result.hiddenAt } : p)) ?? null)
      setFlash(
        hidden
          ? `${product.name} is hidden. The site updates within a few seconds.`
          : `${product.name} is back on the site. The site updates within a few seconds.`
      )
      setConfirming(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not update ${product.name}`)
      setConfirming(null)
    } finally {
      setBusy(null)
    }
  }

  const askToHide = async (product: AdminProduct) => {
    setConfirming(product)
    setUsage(null)
    setUsageError(null)
    try {
      const data = await adminFetch<{ usage: ProductUsage }>(`/api/admin/products/${encodeURIComponent(product.slug)}`)
      setUsage(data.usage)
    } catch (e) {
      setUsageError(e instanceof Error ? e.message : "Could not count bags and wishlists")
    }
  }

  const action = (p: AdminProduct) =>
    p.hidden ? (
      <button type="button" onClick={() => setVisibility(p, false)} disabled={busy === p.slug} className={btn.secondary}>
        <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        {busy === p.slug ? "Saving…" : "Show on site"}
      </button>
    ) : (
      <button type="button" onClick={() => askToHide(p)} disabled={busy === p.slug} className={btn.secondary}>
        <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Hide
      </button>
    )

  const state = (p: AdminProduct) =>
    p.hidden ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
        Hidden{p.hiddenAt ? ` since ${fmtDate(p.hiddenAt)}` : ""}
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-200">
        Live
      </span>
    )

  return (
    <>
      <AdminPageHeader
        title="Products"
        description={products ? `${plural(counts.live, "piece", "pieces")} live · ${counts.hidden} hidden` : undefined}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
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
            title={filter === "hidden" && !search ? "No hidden products" : "No products match"}
            hint={filter === "hidden" && !search ? "Everything in the catalogue is on the site." : "Try another search or filter."}
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
              <li key={p.slug} data-slug={p.slug} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-stone-100">
                  <Image src={p.coverThumbnail} alt="" fill sizes="3rem" className={`object-cover ${p.hidden ? "opacity-50 grayscale" : ""}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-black/55">
                    {p.category} · {p.classification} · <span className="tabular-nums">{formatRupees(p.price)}</span>
                  </p>
                </div>
                <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                  {state(p)}
                  <div className="flex items-center gap-1">
                    {!p.hidden && (
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
                    {action(p)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={Boolean(confirming)}
        onClose={() => busy === null && setConfirming(null)}
        title={confirming ? `Hide ${confirming.name}?` : ""}
        description="It leaves the site within a few seconds. You can show it again at any time."
        footer={
          <>
            <button type="button" onClick={() => setConfirming(null)} disabled={busy !== null} className={btn.secondary}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => confirming && setVisibility(confirming, true)}
              disabled={busy !== null || (!usage && !usageError)}
              className={btn.danger}
            >
              {busy ? "Hiding…" : "Hide product"}
            </button>
          </>
        }
      >
        <div className="space-y-4 font-jost text-sm">
          {usageError ? (
            <Alert>{usageError}. You can still hide the product.</Alert>
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
            <li>Its page shows Page not found and it disappears from listings and search.</li>
            <li>Bags and wishlists show it as unavailable, and it can no longer be ordered.</li>
            <li>Guests&apos; bags and wishlists are not counted.</li>
          </ul>
        </div>
      </Dialog>
    </>
  )
}
