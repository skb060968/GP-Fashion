"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { filterProducts } from "@/lib/search/filterProducts"
import {
  ACTIVE_CATEGORY_SLUGS,
  CATEGORY_SLUGS,
  categoryMeta,
  getAllProducts,
  isActiveCategorySlug,
  sizeOptionsByCategory,
  type CategorySlug,
} from "@/lib/data/categories"
import ProductCard from "@/components/ProductCard"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"

const CATEGORIES: { key: "all" | CategorySlug; label: string }[] = [
  { key: "all", label: "All" },
  ...ACTIVE_CATEGORY_SLUGS.map((category) => ({ key: category, label: categoryMeta[category].title })),
]

export default function ShopClient() {
  const router = useRouter()
  const sp = useSearchParams()

  const q = sp.get("q") ?? ""
  const requestedCategory = sp.get("category")
  const cat: "all" | CategorySlug = requestedCategory && isActiveCategorySlug(requestedCategory) ? requestedCategory : "all"
  const sizes = (sp.get("sizes") ?? "").split(",").filter(Boolean)
  const max = sp.get("max") ?? ""

  const [input, setInput] = useState(q)

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(sp.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (!value || (key === "category" && value === "all")) next.delete(key)
        else next.set(key, value)
      }
      router.replace(`/shop${next.toString() ? `?${next}` : ""}`, { scroll: false })
    },
    [router, sp]
  )

  useEffect(() => {
    if (input === q) return
    const timer = setTimeout(() => setParams({ q: input.trim() }), 250)
    return () => clearTimeout(timer)
  }, [input, q, setParams])

  const all = useMemo(() => getAllProducts(), [])
  const categoryPool = useMemo(() => cat === "all" ? all : all.filter((product) => product.category === cat), [all, cat])
  const availableSizes = useMemo(() => {
    const present = new Set(categoryPool.flatMap((product) => product.sizes))
    const ordered = cat === "all"
      ? CATEGORY_SLUGS.flatMap((category) => sizeOptionsByCategory[category])
      : [...sizeOptionsByCategory[cat]]
    return [...new Set(ordered)].filter((size) => present.has(size))
  }, [cat, categoryPool])
  const selectedSizes = sizes.filter((size) => availableSizes.includes(size))
  useEffect(() => {
    if (selectedSizes.length === sizes.length) return
    setParams({ sizes: selectedSizes.join(",") })
  }, [selectedSizes, setParams, sizes.length])
  const results = useMemo(
    () => filterProducts(categoryPool, { searchText: q, selectedSizes, priceMin: 0, priceMax: max ? Number(max) * 100 : 0 }),
    [categoryPool, max, q, selectedSizes]
  )

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size) ? selectedSizes.filter((candidate) => candidate !== size) : [...selectedSizes, size]
    setParams({ sizes: next.join(",") })
  }
  const hasFilters = Boolean(q || cat !== "all" || selectedSizes.length || max)
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

          <FadeIn className="mx-auto mt-12 max-w-2xl lg:mt-16">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" strokeWidth={1.5} aria-hidden />
              <input
                type="search"
                value={input}
                onChange={(event) => setInput(event.target.value)}
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

          <FadeIn delay={80} className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label="Category">
              {CATEGORIES.map((category) => (
                <button key={category.key} type="button" role="radio" aria-checked={cat === category.key} onClick={() => setParams({ category: category.key })} className={chip(cat === category.key)}>
                  {category.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {availableSizes.length > 0 && <span className="mr-1 font-jost text-xs uppercase tracking-[0.15em] text-black/50">Size</span>}
              {availableSizes.map((size) => (
                <button key={size} type="button" aria-pressed={selectedSizes.includes(size)} onClick={() => toggleSize(size)} className={chip(selectedSizes.includes(size))}>
                  {size}
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
                  onChange={(event) => setParams({ max: event.target.value })}
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

          {results.length === 0 ? (
            <FadeIn className="mx-auto mt-20 max-w-md text-center">
              <h2 className="font-cinzel text-xl font-bold uppercase tracking-[0.15em]">Nothing matches</h2>
              <p className="mt-4 font-jost text-black/65">Try a different name, or clear the filters to see every piece.</p>
              <button type="button" onClick={clear} className="btn-outline-dark mt-8">Clear filters</button>
            </FadeIn>
          ) : (
            <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:mt-16 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
              {results.map((product, index) => (
                <li key={product.slug}>
                  <FadeIn delay={(index % 4) * 60}>
                    <ProductCard product={product} priority={index < 4} />
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
