"use client"

import { useId, useMemo, useState } from "react"
import FadeIn from "@/components/FadeIn"
import ProductCard from "@/components/ProductCard"
import type { Product } from "@/lib/data/categories"

type SortKey = "featured" | "newest" | "price-asc" | "price-desc"

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
]

function sortProducts(products: Product[], sort: SortKey): Product[] {
  if (sort === "featured") return products
  const sorted = [...products]
  if (sort === "newest") {
    sorted.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "") || a.order - b.order)
  } else if (sort === "price-asc") {
    sorted.sort((a, b) => a.price - b.price || a.order - b.order)
  } else {
    sorted.sort((a, b) => b.price - a.price || a.order - b.order)
  }
  return sorted
}

function isSortKey(value: string): value is SortKey {
  return SORT_OPTIONS.some((option) => option.value === value)
}

export default function SortedProductGrid({ products }: { products: Product[] }) {
  const [sort, setSort] = useState<SortKey>("featured")
  const selectId = useId()
  const sorted = useMemo(() => sortProducts(products, sort), [products, sort])

  return (
    <>
      {products.length > 1 && (
        <div className="mt-14 flex justify-end lg:mt-16">
          <div className="flex items-center gap-3">
            <label htmlFor={selectId} className="font-jost text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
              Sort
            </label>
            <select
              id={selectId}
              value={sort}
              onChange={(e) => {
                if (isSortKey(e.target.value)) setSort(e.target.value)
              }}
              className="h-9 border border-black/20 bg-white px-3 font-jost text-sm text-black transition-colors hover:border-black focus-visible:border-black"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <ul
        className={`grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4 ${
          products.length > 1 ? "mt-8" : "mt-14 lg:mt-16"
        }`}
      >
        {sorted.map((product, index) => (
          <li key={product.slug}>
            <FadeIn delay={(index % 4) * 60}>
              <ProductCard product={product} priority={index < 4} />
            </FadeIn>
          </li>
        ))}
      </ul>
    </>
  )
}
