"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { filterProducts } from "@/lib/search/filterProducts"
import { getAllProducts, categoryOf, categoryMeta, type CategorySlug } from "@/lib/data/categories"
import ProductCard from "@/components/ProductCard"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"

const SIZES = ["S", "M", "L", "XL"] as const
const CATEGORIES: { key: "all" | CategorySlug; label: string }[] = [
  { key: "all", label: "All" },
  { key: "menswear", label: categoryMeta.menswear.title },
  { key: "womenswear", label: categoryMeta.womenswear.title },
]

export default function ShopClient() {
  const router = useRouter()
  const sp = useSearchParams()

  const q = sp.get("q") ?? ""
  const cat = (sp.get("category") as "all" | CategorySlug | null) ?? "all"
  const sizes = (sp.get("sizes") ?? "").split(",").filter(Boolean)
  const max = sp.get("max") ?? ""

  const [input, setInput] = useState(q)

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (!v || (k === "category" && v === "all")) next.delete(k)
        else next.set(k, v)
      }
      router.replace(`/shop${next.toString() ? `?${next}` : ""}`, { scroll: false })
    },
    [router, sp]
  )

  useEffect(() => {
    if (input === q) return
    const t = setTimeout(() => setParams({ q: input.trim() }), 250)
    return () => clearTimeout(t)
  }, [input, q, setParams])

  const all = useMemo(() => getAllProducts(), [])
  const results = useMemo(() => {
    const pool = cat === "all" ? all : all.filter((p) => categoryOf(p.slug) === cat)
    return filterProducts(pool, { searchText: q, selectedSizes: sizes, priceMin: 0, priceMax: max ? Number(max) * 100 : 0 })
  }, [all, cat, q, sizes, max])

  const toggleSize = (s: string) => {
    const next = sizes.includes(s) ? sizes.filter((x) => x !== s) : [...sizes, s]
    setParams({ sizes: next.join(",") })
  }
  const hasFilters = Boolean(q || cat !== "all" || sizes.length || max)
  const clear = () => {
    setInput("")
    router.replace("/shop", { scroll: false })
  }

  const chip = (on: boolean) =>
    `inline-flex h-9 shrink-0 items-center rounded-full border px-4 font-jost text-xs font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:ring-black ${
      on ? "border-black bg-black text-white" : "border-black/20 text-black/70 hover:border-black hover:text-black"
    }`

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading title="All Pieces" meta={`${results.length} of ${all.length} ${all.length === 1 ? "piece" : "pieces"}`} />

          {/* Search */}
          <FadeIn className="mx-auto mt-12 max-w-2xl lg:mt-16">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" strokeWidth={1.5} aria-hidden />
              <input
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search by name"
                aria-label="Search pieces"
                autoFocus={Boolean(sp.get("focus"))}
                className="w-full rounded-full border border-black/15 bg-white py-4 pl-14 pr-12 font-jost text-base text-black placeholder:text-black/40 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              />
              {input && (
                <button type="button" onClick={() => setInput("")} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-black/50 hover:text-black">
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </button>
              )}
            </label>
          </FadeIn>

          {/* Filters */}
          <FadeIn delay={80} className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Category">
              {CATEGORIES.map((c) => (
                <button key={c.key} type="button" role="radio" aria-checked={cat === c.key} onClick={() => setParams({ category: c.key })} className={chip(cat === c.key)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="mr-1 font-jost text-xs uppercase tracking-[0.15em] text-black/50">Size</span>
              {SIZES.map((s) => (
                <button key={s} type="button" aria-pressed={sizes.includes(s)} onClick={() => toggleSize(s)} className={chip(sizes.includes(s))}>
                  {s}
                </button>
              ))}
              <span className="ml-3 mr-1 font-jost text-xs uppercase tracking-[0.15em] text-black/50">Up to</span>
              <label className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-jost text-sm text-black/50">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={500}
                  value={max}
                  onChange={(e) => setParams({ max: e.target.value })}
                  placeholder="Any"
                  aria-label="Maximum price in rupees"
                  className="h-9 w-28 rounded-full border border-black/20 bg-white pl-7 pr-3 font-jost text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </label>
              {hasFilters && (
                <button type="button" onClick={clear} className="ml-2 inline-flex h-9 items-center gap-1 font-jost text-xs uppercase tracking-[0.12em] text-black/60 underline-offset-4 hover:text-black hover:underline">
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden /> Clear
                </button>
              )}
            </div>
          </FadeIn>

          {/* Results */}
          {results.length === 0 ? (
            <FadeIn className="mx-auto mt-20 max-w-md text-center">
              <h2 className="font-cinzel text-xl font-bold uppercase tracking-[0.15em]">Nothing matches</h2>
              <p className="mt-4 font-jost text-black/65">Try a different name, or clear the filters to see every piece.</p>
              <button type="button" onClick={clear} className="btn-outline-dark mt-8">Clear filters</button>
            </FadeIn>
          ) : (
            <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:mt-16 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
              {results.map((p, i) => (
                <li key={p.slug}>
                  <FadeIn delay={(i % 4) * 60}>
                    <ProductCard product={p} priority={i < 4} />
                  </FadeIn>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
